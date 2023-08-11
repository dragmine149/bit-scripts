# bit-scripts
Some of my custom files for bit burner. Not designed to help out with progression.

## Usages
Each folder is a different module. Each containing a differnet item. For that module to work, the whole folder must be imported into the game.

The recommended option to put stuff into the game is by getting the `Git.js` file and running that as it is a self-contained mini git view that lest you download a whole module.
Note: Upon downloading `Git.js` into `Git.js` . It is recommended to run the command `Git/git.js --setup` follwed by `git --help`

## Running Modules.
Most modules come with an `AutoStart.js` script. This will be ran once the module has been downloaded (if using `git.js` script). The `AutoStart.js` will give you some options of what you can do with that module
(Normally assign `alias` and `help`) 

If a module doesn't come with `AutoStart.js` the file to run is normally the same name as the module. E.g. `Htop/htop.js` where `htop.js` has the same name as the folder.

## Other information
Fell free to use any of these scripts and modify them how you see fit.
Dont move the scripts outside of the folder they are dedicated for (as that can break the mmain module, just copy and paste if you need to do so).
