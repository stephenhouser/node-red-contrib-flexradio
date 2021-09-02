# Development Notes

* Using a monorepo and [lerna](https://github.com/lerna/lerna) to manage the included modules.

* Typically use a docker container to test within


## Make, publish, etc..

1. Make your changes, etc, etc.. 
2. Commit changes. Optional push (lerna will push and tag version)
3. `lerna publish from-git`
