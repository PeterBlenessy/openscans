# PyInstaller spec for the MR segmentation engine.
#
#   pyinstaller mr_segmentation.spec
#
# Produces a standalone `mr-segmentation` binary (dist/mr-segmentation) that the
# app downloads on demand. TotalSegmentator pulls in torch + nnU-Net, which need
# extra hidden imports / collected data — these are starting points; expect to
# extend `hiddenimports` and `datas` when first building per platform (flagged in
# plans/LOCAL_AI_PROVIDER.md). Build on each target OS; PyInstaller does not
# cross-compile.
from PyInstaller.utils.hooks import collect_submodules, collect_data_files

hiddenimports = (
    collect_submodules("totalsegmentator")
    + collect_submodules("nnunetv2")
    + collect_submodules("acvl_utils")
    + collect_submodules("dynamic_network_architectures")
)

datas = (
    collect_data_files("totalsegmentator")
    + collect_data_files("nnunetv2")
)

block_cipher = None

a = Analysis(
    ["run.py"],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    cipher=block_cipher,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    name="mr-segmentation",
    console=True,
)
