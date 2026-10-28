"""Loads a project for the Python scripts, through lib/project.mjs."""
import json
import os
import subprocess
import sys

LIB = os.path.dirname(os.path.abspath(__file__))


def load(args=None):
    """Returns (project, build_dir). The first argument is the project directory."""
    args = sys.argv[1:] if args is None else args
    if not args or args[0].startswith('-'):
        sys.exit(f'usage: {os.path.basename(sys.argv[0])} <project-dir> [options]')
    project_dir = os.path.abspath(args[0])
    r = subprocess.run(['node', os.path.join(LIB, 'project.mjs'), project_dir], capture_output=True, text=True)
    if r.returncode:
        sys.exit(r.stderr.strip() or f'could not load {project_dir}')
    project = json.loads(r.stdout)
    build = project['build']
    os.makedirs(build, exist_ok=True)
    return project, build


def read_json(build, name):
    path = os.path.join(build, name)
    if not os.path.exists(path):
        sys.exit(f'{path} is missing; run the earlier step first')
    with open(path) as f:
        return json.load(f)


def write_json(build, name, data, **kw):
    with open(os.path.join(build, name), 'w') as f:
        json.dump(data, f, **kw)
