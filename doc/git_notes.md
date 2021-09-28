<https://git-scm.com/book/en/v2/Getting-Started-First-Time-Git-Setup>
```
git config --global user.name "Vincent Le Falher"
git config --global user.email vincent.lefalher@bell.ca
git config --global core.autocrlf false
git init
git status
git add *
git commit -m "changes summary"
git commit --amend (to change commit message)
git clone --bare panini panini.git
git remote add origin c:/Users/vincent.le_falher/Dropbox/git/panini.git
git remote add 2720bernini \\tsclient\C\Users\vinclefa\Dropbox\git\ctips.git
git remote add origin \\tsclient\C\Users\vincent.le_falher\Dropbox\git\ctips.git
git remote -v
git tag
git tag v2.0.4.4
git tag -d v1.9
git tag -a -m "(VTRT-188) ..." 2.11.1
git tag --sort=v:refname
git ls-remote --tags origin
git push --delete origin v1.17
git push -d origin dev-ha
git push origin dev-unittest
# to make sure all latest code from master is in lab-unittest
(from dev-unittest) git merge master
git checkout master
# to update master branch with latest changes from lab-unittest
(from master) git merge dev-unittest
git checkout dev-unittest
git diff
git log
git stash
git stash list
git stash show
git stash apply
git fetch # to retrieve metadata from remote original project; and git diff ...origin after to see changes before a git pull

git fetch origin --prune --prune-tags

git diff ...origin

git pull

git branch # local branch

git branch -a # all local and remote

git branch -r # remote branches

git branch -d <branch name>

git push origin --delete <branch_name>

git add, create file .gitignore with following content before :

.DS_Store
node_modules/
dist/
npm-debug.log
yarn-error.log
logs/
.idea
*.suo
*.ntvs*
*.njsproj
*.sln
*.zip
```

# GitLab


Command line instructions
You can also upload existing files from your computer using the instructions below.

## Git global setup
```
git config --global user.name "Vincent Le Falher"
git config --global user.email "vincent.lefalher@bell.ca"
```

## Create a new repository
```git clone git@gitlab.int.bell.ca:ops/ansible-python-venv.git
cd ansible-python-venv
touch README.md
git add README.md
git commit -m "add README"
git push -u origin master
Push an existing folder
cd existing_folder
git init
git remote add origin git@gitlab
.int.bell.ca:ops/ansible-python-venv.git
git add .
git commit -m "Initial commit"
git push -u origin master
```
## Push an existing Git repository
```
cd existing_repo
git remote rename origin old-origin
git remote add origin git@gitlab.int.bell.ca:ops/ansible-python-venv.git
git branch --set-upstream-to=origin/master master
git push -u origin --all
git push -u origin --tags
Git reset
```

If you know you want to use git reset, it still depends what you mean by "uncommit". If all you want to do is undo the act of committing, leaving everything else intact, use:
```
git reset --soft HEAD^
```

If you want to undo the act of committing and everything you'd staged, but leave the work tree (your files intact):

```git reset HEAD^
```

And if you actually want to completely undo it, throwing away all uncommitted changes, resetting everything to the previous commit (as the original question asked):

```
git reset --hard HEAD^
```

## Removing already pushed files

```
git rm -r --cached some-directory
git commit -m 'Remove the now ignored directory "some-directory"'
git push origin master
Git .ignores
```

Reference: https://linuxize.com/post/gitignore-ignoring-files-in-git/

## Comments
Lines starting with a hash mark (#) are comments and are ignored. Empty lines can be used to improve the readability of the file and to group related lines of patterns.

## Slash
The slash symbol (/) represents a directory separator. The slash at the beginning of a pattern is relative to the directory where the .gitignore resides.

If the pattern starts with a slash, it matches files and directories only in the repository root.

If the pattern doesn’t start with a slash, it matches files and directories in any directory or subdirectory.

If the pattern ends with a slash, it matches only directories. When a directory is ignored, all of its files and subdirectories are also ignored.

## Literal File Names
The most straightforward pattern is a literal file name without any special characters.

## Pattern	Example matches

/access.log	access.log
access.log	access.log
logs/access.log
var/logs/access.log
build/	build
Wildcard Symbols
* - The asterisk symbol matches zero or more characters.
Pattern	Example matches
*.log	error.log
logs/debug.log
build/logs/error.log
** - Two adjacent asterisk symbols match any file or zero or more directories. When followed by a slash (/), it matches only directories.
Pattern	Example matches
logs/**	Matches anything inside the logs directory.
**/build	var/build
pub/build
build
foo/**/bar	foo/bar
foo/a/bar
foo/a/b/c/bar
? - The question mark matches any single character.
Pattern	Example matches
access?.log	access0.log
access1.log
accessA.log
foo??	fooab
foo23
foo0s
Square brackets
[...] - Matches any of the characters enclosed in the square brackets. When two characters are separated by a hyphen - it denotes a range of characters. The range includes all characters that are between those two characters. The ranges can be alphabetic or numeric.

If the first character following the [ is an exclamation mark (!), then the pattern matches any character except those from the specified set.

Pattern	Example matches
*.[oa]	file.o
file.a
*.[!oa]	file.s
file.1
file.0
access.[0-2].log	access.0.log
access.1.log
access.2.log
file.[a-c].out	file.a.out
file.b.out
file.c.out
file.[a-cx-z].out	file.a.out
file.b.out
file.c.out
file.x.out
file.y.out
file.z.out
access.[!0-2].log	access.3.log
access.4.log
access.Q.log
Negating Patterns
A pattern that starts with an exclamation mark (!) negates (re-include) any file that is ignored by the previous pattern. The exception to this rule is to re-include a file if its parent directory is excluded.

Pattern	Example matches
*.log
!error.log	error.log or logs/error.log will not be ignored
.gitignore Example
Below is an example of what your .gitignore file could look like:


# Ignore the node_modules directory
node_modules/

# Ignore Logs
logs
*.log

# Ignore the build directory
/dist

The file containing environment variables
.env

# Ignore IDE specific files
.idea/
.vscode/
*.sw*
Local .gitignore
A local .gitignore file is usually placed in the repository’s root directory. However, you can create multiple .gitignore files in different subdirectories in your repository. The patterns in the .gitignore files are matched relative to the directory where the file resides.

Patterns defined in the files that reside in lower-level directories (sub-directories) have precedence over those in higher-level directories.

Local .gitignore files are shared with other developers and should contain patterns that are useful for all other users of the repository.

Global .gitignore
Git also allows you to create a global .gitignore file, where you can define ignore rules for every Git repository on your local system.

The file can be named anything you like and stored in any location. The most common place to keep this file is the home directory. You’ll have to manually create the file and configure Git to use it.

For example, to set ~/.gitignore_global as the global Git ignore file, you would do the following:

Create the file:

touch ~/.gitignore_global
Add the file to the Git configuration:

git config --global core.excludesfile ~/.gitignore_global
Open the file with your text editor and add your rules to it.

Global rules are particularly useful for ignoring particular files that you never want to commit, such as files with sensitive information or compiled executables.

Ignoring a Previously Committed Files The files in your working copy can be either tracked or untracked.
To ignore a file that has been previously committed, you’ll need to unstage and remove the file from the index, and then add a rule for the file in .gitignore:

git rm --cached filename
The --cached option tells git not to delete the file from the working tree but only to remove it from the index.

To recursively remove a directory, use the -r option:

git rm --cached filename
If you want to remove the file from both the index and local filesystem, omit the --cached option.

When recursively deleting files, use the -n option that will perform a “dry run” and show you what files will be deleted:

git rm -r -n directory
Debugging .gitignore File Sometimes it can be challenging to determine why a specific file is being ignored, especially when you’re are using multiple .gitignore files or complex patterns. This is where the git check-ignore command with the -v option, which tells git to display details about the matching pattern, comes handy.
For example, to check why the www/yarn.lock file is ignored you would run:

git check-ignore -v www/yarn.lock
The output shows the path to the gitignore file, the number of the matching line, and the actual pattern.

www/.gitignore:31:/yarn.lock	www/yarn.lock
The command also accepts more than one filename as arguments, and the file doesn’t have to exist in your working tree.
Displaying All Ignored Files The git status command with the --ignored option displays a list of all ignored files:
git status --ignored

## Credential
Reference: <https://git-scm.com/book/en/v2/Git-Tools-Credential-Storage>
```git config --global credential.helper cache```
