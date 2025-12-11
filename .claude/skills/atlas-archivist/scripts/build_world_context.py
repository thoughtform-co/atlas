#!/usr/bin/env python3
"""
Build world context for the Atlas Archivist.

This script generates a markdown-formatted world context from a list of denizens.
It mirrors the logic from src/lib/archivist/utils.ts buildArchivistWorldContext.

Usage:
    python build_world_context.py <denizens_json>

Input: JSON array of denizen objects
Output: Markdown-formatted world context
"""

import json
import sys
from typing import List, Dict, Any


def build_world_context(denizens: List[Dict[str, Any]]) -> str:
    """
    Build world context markdown from denizen list.
    
    Args:
        denizens: List of denizen dictionaries with keys:
            - id, name, type, allegiance, domain, description, threat_level, lore, features
    
    Returns:
        Markdown-formatted world context string
    """
    if not denizens or len(denizens) == 0:
        return "The archive is empty. You are cataloguing the first entities."
    
    parts = []
    parts.append(f"The archive currently holds **{len(denizens)}** catalogued entities.\n")
    
    # Entity types distribution
    type_counts = {}
    for d in denizens:
        entity_type = d.get('type', 'Unknown')
        type_counts[entity_type] = type_counts.get(entity_type, 0) + 1
    
    parts.append("### Entity Types")
    for entity_type, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
        parts.append(f"- **{entity_type}**: {count} entities")
    
    # Allegiance distribution
    allegiance_counts = {}
    for d in denizens:
        allegiance = d.get('allegiance')
        if allegiance:
            allegiance_counts[allegiance] = allegiance_counts.get(allegiance, 0) + 1
    
    if allegiance_counts:
        parts.append("\n### Allegiances")
        for allegiance, count in sorted(allegiance_counts.items(), key=lambda x: x[1], reverse=True):
            parts.append(f"- **{allegiance}**: {count} entities")
    
    # Domains discovered
    domains = list(set(d.get('domain') for d in denizens if d.get('domain')))
    if domains:
        parts.append("\n### Domains Discovered")
        domain_samples = domains[:15]
        for domain in domain_samples:
            count = sum(1 for d in denizens if d.get('domain') == domain)
            parts.append(f"- {domain}{f' ({count} entities)' if count > 1 else ''}")
        if len(domains) > 15:
            parts.append(f"- ...and {len(domains) - 15} more unique domains")
    
    # Recent entities (most recent 5, sorted by ID as proxy for creation order)
    sorted_denizens = sorted(denizens, key=lambda d: d.get('id', ''), reverse=True)
    parts.append("\n### Recent Additions")
    for d in sorted_denizens[:5]:
        name = d.get('name', 'Unknown')
        entity_type = d.get('type', 'Unknown')
        domain = d.get('domain', 'Domain unknown')
        parts.append(f"- **{name}** ({entity_type}) — {domain}")
        
        description = d.get('description')
        if description:
            short_desc = description[:100] + '...' if len(description) > 100 else description
            parts.append(f"  _{short_desc}_")
    
    # Entity names for connection suggestions
    parts.append("\n### All Catalogued Entities")
    parts.append("Use these names when suggesting connections:")
    entity_names = [d.get('name', 'Unknown') for d in denizens]
    parts.append(', '.join(entity_names))
    
    return '\n'.join(parts)


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python build_world_context.py <denizens_json>", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Read JSON from file or stdin
        if sys.argv[1] == '-':
            denizens_json = sys.stdin.read()
        else:
            with open(sys.argv[1], 'r') as f:
                denizens_json = f.read()
        
        denizens = json.loads(denizens_json)
        
        if not isinstance(denizens, list):
            print("Error: Input must be a JSON array of denizens", file=sys.stderr)
            sys.exit(1)
        
        context = build_world_context(denizens)
        print(context)
        
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON: {e}", file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print(f"Error: File not found: {sys.argv[1]}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()

