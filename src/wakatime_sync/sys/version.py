from __future__ import annotations

import os
from importlib.metadata import PackageNotFoundError, version


def get_app_version() -> str:
    try:
        return version("wakatime-sync")
    except PackageNotFoundError:
        return os.getenv("SETUPTOOLS_SCM_PRETEND_VERSION", "0.0.0-dev")
