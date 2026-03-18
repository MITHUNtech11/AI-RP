#!/usr/bin/env python3
"""Fix indentation in streamlit_app.py"""

with open('streamlit_app.py', 'r') as f:
    content = f.read()

# The file has functions that should be at module level but are indented
# Find and fix the indentation

lines = content.split('\n')
fixed_lines = []
in_module_level = True

for i, line in enumerate(lines):
    # Lines 0-22 are already correct (imports and config)
    if i < 24:
        fixed_lines.append(line)
        continue
    
    # For lines 24+ (functions), if they have 4 extra spaces, remove them
    # EXCEPT for lines that are CSS/HTML content inside strings or should stay indented
    if line.startswith('    def ') or line.startswith('    ICON_') or line.startswith('    if __name__'):
        # Module-level definitions should have no leading spaces
        fixed_lines.append(line[4:])
    elif line.startswith('    def render_') or line.startswith('    def pretty_render') or line.startswith('    def main'):
        fixed_lines.append(line[4:])
    elif line.startswith('        ') and i >= 24:
        # Inside function bodies, these should have 4 spaces (one indent)
        # Check if they currently have 8+
        if line.startswith('        ') and not line.startswith('            '):
            # Remove 4 spaces to get to correct indentation
            fixed_lines.append(line[4:])
        else:
            fixed_lines.append(line)
    else:
        fixed_lines.append(line)

result = '\n'.join(fixed_lines)

with open('streamlit_app.py', 'w') as f:
    f.write(result)

print("Fixed indentation")
