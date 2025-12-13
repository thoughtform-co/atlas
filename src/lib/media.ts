import { supabase, isSupabaseConfigured } from './supabase';
import { DenizenMedia, MediaType } from './types';

/**
 * Storage bucket name for denizen media files
 */
const MEDIA_BUCKET = 'denizen-media';

/**
 * Transform database row to DenizenMedia type
 */
export interface MediaRow {
  id: string;
  denizen_id: string;
  media_type: string;
  storage_path: string;
  file_name: string;
  name: string | null;
  file_size: number | null;
  mime_type: string | null;
  display_order: number;
  is_primary: boolean;
  caption: string | null;
  alt_text: string | null;
  created_at: string;
  updated_at: string;
}

export function transformMediaRow(row: MediaRow): DenizenMedia {
  return {
    id: row.id,
    denizenId: row.denizen_id,
    mediaType: row.media_type as MediaType,
    storagePath: row.storage_path,
    fileName: row.file_name,
    name: row.name ?? undefined,
    fileSize: row.file_size ?? undefined,
    mimeType: row.mime_type ?? undefined,
    displayOrder: row.display_order,
    isPrimary: row.is_primary,
    caption: row.caption ?? undefined,
    altText: row.alt_text ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Get public URL for a media file
 * Handles both full URLs (returns as-is) and storage paths (converts to public URL)
 */
export function getMediaPublicUrl(storagePath: string | undefined): string | null {
  if (!storagePath) {
    return null;
  }
  
  // If it's already a full URL, return it
  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath;
  }
  
  // Otherwise convert from storage path
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }
  
  const { data } = supabase.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(storagePath);
  
  return data.publicUrl;
}

/**
 * Fetch all media for a specific denizen
 */
export async function fetchDenizenMedia(denizenId: string): Promise<DenizenMedia[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('denizen_media')
      .select('*')
      .eq('denizen_id', denizenId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching denizen media:', error);
      return [];
    }

    return (data as MediaRow[] || []).map(transformMediaRow);
  } catch (error) {
    console.error('Error in fetchDenizenMedia:', error);
    return [];
  }
}

/**
 * Upload media file for a denizen
 */
export async function uploadDenizenMedia(
  denizenId: string,
  file: File,
  mediaType: MediaType,
  options?: {
    isPrimary?: boolean;
    caption?: string;
    altText?: string;
    displayOrder?: number;
  }
): Promise<DenizenMedia | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('Supabase not configured');
    return null;
  }

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const storagePath = `${denizenId}/${mediaType}/${timestamp}.${extension}`;

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return null;
    }

    // If this is marked as primary, unset other primaries for this denizen/type
    if (options?.isPrimary) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('denizen_media')
        .update({ is_primary: false })
        .eq('denizen_id', denizenId)
        .eq('media_type', mediaType);
    }

    // Create database record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error: insertError } = await (supabase as any)
      .from('denizen_media')
      .insert({
        denizen_id: denizenId,
        media_type: mediaType,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        is_primary: options?.isPrimary ?? false,
        caption: options?.caption ?? null,
        alt_text: options?.altText ?? null,
        display_order: options?.displayOrder ?? 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating media record:', insertError);
      // Try to clean up uploaded file
      await supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
      return null;
    }

    return transformMediaRow(data as MediaRow);
  } catch (error) {
    console.error('Error in uploadDenizenMedia:', error);
    return null;
  }
}

/**
 * Delete a media file and its record
 */
export async function deleteDenizenMedia(mediaId: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    // First get the record to find the storage path
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: media, error: fetchError } = await (supabase as any)
      .from('denizen_media')
      .select('storage_path')
      .eq('id', mediaId)
      .single();

    if (fetchError || !media) {
      console.error('Error fetching media record:', fetchError);
      return false;
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(MEDIA_BUCKET)
      .remove([media.storage_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue to delete record anyway
    }

    // Delete database record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('denizen_media')
      .delete()
      .eq('id', mediaId);

    if (deleteError) {
      console.error('Error deleting media record:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteDenizenMedia:', error);
    return false;
  }
}

/**
 * Update media metadata
 */
export async function updateDenizenMedia(
  mediaId: string,
  updates: {
    name?: string;
    isPrimary?: boolean;
    caption?: string;
    altText?: string;
    displayOrder?: number;
  }
): Promise<DenizenMedia | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    // If setting as primary, first unset others
    if (updates.isPrimary) {
      // Get the media to find its denizen and type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase as any)
        .from('denizen_media')
        .select('denizen_id, media_type')
        .eq('id', mediaId)
        .single();

      if (existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('denizen_media')
          .update({ is_primary: false })
          .eq('denizen_id', existing.denizen_id)
          .eq('media_type', existing.media_type);
      }
    }

    // Build update object with only defined fields
    const updateData: Record<string, any> = {};
    if (updates.name !== undefined) updateData.name = updates.name ?? null;
    if (updates.isPrimary !== undefined) updateData.is_primary = updates.isPrimary;
    if (updates.caption !== undefined) updateData.caption = updates.caption ?? null;
    if (updates.altText !== undefined) updateData.alt_text = updates.altText ?? null;
    if (updates.displayOrder !== undefined) updateData.display_order = updates.displayOrder;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('denizen_media')
      .update(updateData)
      .eq('id', mediaId)
      .select()
      .single();

    if (error) {
      console.error('Error updating media:', error);
      return null;
    }

    return transformMediaRow(data as MediaRow);
  } catch (error) {
    console.error('Error in updateDenizenMedia:', error);
    return null;
  }
}

/**
 * Get primary image for a denizen
 */
export async function getPrimaryImage(denizenId: string): Promise<string | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('denizen_media')
      .select('storage_path')
      .eq('denizen_id', denizenId)
      .eq('media_type', 'image')
      .eq('is_primary', true)
      .single();

    if (error || !data) {
      return null;
    }

    return getMediaPublicUrl(data.storage_path);
  } catch (error) {
    console.error('Error in getPrimaryImage:', error);
    return null;
  }
}
