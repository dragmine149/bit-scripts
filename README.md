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

## Module Information
This section just contains information about what each module does. Although they are explained in their represented `--help` menus.

### AnotherStupidThing (Name to be changed)
Make a whole new menu. With whatever you want in there. Easy to use.
Currently there missing lots of support (as of v0.1.0).
To run: `run AnotherStupidThing/nav.js` This will take any folder provided in `AnotherStupidThing` and their information to make the ui.
More information will be provided once more supported. For now feel free to have a look at the default `Test` folder.

### Git
Commands and other basic git abilities.
NOTE: might not work well with other repos.

### HTOP
A similar like clone of the `htop` command that can be downloaded using `apt` in terminals.
Shows processes, ram usage, etc across all servers.

### Testing
Don't bother with this.. trust me.
Its there to test if Git is working really.

### py
Using the ability of [`py-script`](https://pyscript.net) we now can run python code in `ns2`.
Just be warned, this does require a bit of a workaround solution with some of the methods.
Ram requirements is still a thing. (So don't except to get away with using `ns.singularity` for free.
NOTE: running any kind of sleep should be done asynciously to avoid lagging the game.

## Other information
Fell free to use any of these scripts and modify them how you see fit.
Dont move the scripts outside of the folder they are dedicated for (as that can break the mmain module, just copy and paste if you need to do so).
