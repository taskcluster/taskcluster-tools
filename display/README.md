Updating noVNC
==============

Just remove the `include/` folder and download the master branch from:
        https://github.com/kanaka/noVNC
Extract `include/` and test that everything works as intended.
(please, remember to also update LICENSE.txt)

Someday when noVNC is packaged nicely this won't be so stupid and we can
likely just require it via. npm. But for now this is a decent solution, there
is occasional bug fixes to noVNC, so using the upstream this way is better than
some better packaged fork that doesn't get updates.

