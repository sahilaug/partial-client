# TerraceAg Client

This repository is home to all of the client side code for the TerraceAg project.

## Getting Started

#### Clone Repo:
```
git clone git@github.com:TerraceAg/client.git
```

#### Install Packages:
```
yarn
```
If you do not have yarn installed, follow [these instructions](https://yarnpkg.com/en/docs/install)

#### Start Development:
```
yarn dev
```

This starts a dev server at [localhost:8080](localhost:8080). Making changes to anything in the `/src` folder will rebundle and reload the page at localhost:8080.

#### Testing:
For unit test, enter the command `yarn test` to run the test suite. This project uses [Jest](https://facebook.github.io/jest/) and [Enzyme](http://airbnb.io/enzyme/index.html) for all of the Java[Type]Script and React testing.

You can also run `yarn test:watch` to run the test suite in watch mode. Jest's watch mode is very nice and allows you to do things like only run tests for changed files, all tests, and filter tests by test name and file name.

For the end to end tests, enter the command `yarn run e2e` to run the test suite.


## SOLUTIONS TO DEVELOPER ASSIGNMENTS: 

PARTA : 
Resizing with snap feature: with the current implementation using react-contenteditable, we dont get the current width while resizing the image. I have divided the figure into 4 grid lines and the image snaps to one of them (one fourth, half, three fourth, or fullwidth)
Cropping: TODO

PARTB: Content Overflow: TODO

PARTC: 
For implementing google drive Sync kind of a functionality, we would need a socket connection with the server.
On load of the report view (onCompoenntDidMount lifecycle method), we should start listening to a socket connection with Id related to reportId.
Whenever the user changes something in the report from the browser, we can send the client state (should be kept in redux) to one api(/makeChange), makeChange api should then send out a message to all the users listening to the socket containing the current reportId.
All the clients with socketIds containing the reportId get notified, on this event, the react/redux state driving the component UI should get updated.  