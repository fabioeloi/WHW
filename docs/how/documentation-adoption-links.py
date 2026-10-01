# SPDX-License-Identifier: MIT
# Editorial audit helper, not a product test or a replacement for GitHub rendering.
from pathlib import Path
import re, subprocess, urllib.parse, sys
root=Path.cwd()
files=[Path(x) for x in subprocess.check_output(['git','diff','--name-only',sys.argv[1] if len(sys.argv)>1 else 'e72e33a'],text=True).splitlines() if x.endswith('.md')]
files+=list(Path('docs/pt-BR').glob('*.md'))+[Path('docs/README.md')]
files+=list(Path('docs/how').glob('documentation-adoption*.md'))
files=sorted(set(files)); errors=[];count=0
for p in files:
 s=p.read_text()
 # Markdown links, including badge wrappers. Skip code fences for literal examples.
 s=re.sub(r'```.*?```','',s,flags=re.S)
 for target in re.findall(r'\]\(([^\s)]+)(?:\s+[^)]*)?\)',s):
  if re.match(r'^[a-z]+:',target): continue
  path,sep,anchor=urllib.parse.unquote(target).partition('#')
  dest=(p.parent/path).resolve() if path else p.resolve();count+=1
  if not dest.exists(): errors.append(f'{p}: missing {target}');continue
  if sep and dest.is_file():
   content=dest.read_text(); content=re.sub(r'```.*?```','',content,flags=re.S)
   slugs=[];seen={}
   for h in re.findall(r'^#{1,6}\s+(.+)$',content,re.M):
    h=re.sub('<[^>]+>','',h).lower().strip();h=re.sub(r'[^\w\- ]','',h);h=h.replace(' ','-');n=seen.get(h,0);seen[h]=n+1;slugs.append(h+(f'-{n}' if n else ''))
   slugs+=re.findall(r'id=["\']([^"\']+)',content)
   if anchor not in slugs:errors.append(f'{p}: bad anchor {target}')
print(f'{len(files)} documents; {count} local targets; {len(errors)} errors')
print('\n'.join(errors));raise SystemExit(bool(errors))
