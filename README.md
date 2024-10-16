# Deal Lab - Fix & Flipper

## Table of Contents

- [Description](#description)
- [Built With](#built-with)
- [Prerequisites](#prerequisite)
- [Installation](#installation)
- [Usage](#usage)

## Description

The Deal Lab - Fix & Flipper is an easier way to help flippers calculate out these expenses on specific properties before investing in properties to fix and flip.  By grabbing data from 3rd party sources, Fix & Flipper automatically inputs many of the details that a flipper would’ve needed to provide through their own prior research.  Our app also allows flippers to customize data such as specific repair costs and holding periods.

## Built With

Javascript, HTML, CSS, NodeJS, Express, React, Redux, Redux-Saga, PostgreSQL, Rest APIs, Figma
<a href="https://www.w3schools.com/w3css/defaulT.asp"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original.svg" height="40px" width="40px" /></a>
<a href="https://www.w3schools.com/html/"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original.svg" height="40px" width="40px" /></a>
<a href="https://www.w3schools.com/js/default.asp"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" height="40px" width="40px" /></a>
<a href="https://www.postgresql.org/"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original.svg" height="40px" width="40px" /></a>
<a href="https://reactjs.org/"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original-wordmark.svg" height="40px" width="40px" /></a>
<a href="https://redux.js.org/"><img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/redux/redux-original.svg" height="40px" width="40px" /></a>
<a href="https://www.figma.com/?fuid="><img src="https://github.com/devicons/devicon/blob/master/icons/figma/figma-original.svg" height="40px" width="40px" /></a>
<a href="https://nodejs.org/en/"><img src="https://github.com/devicons/devicon/blob/master/icons/nodejs/nodejs-plain.svg" height="40px" width="40px" /></a>

## Getting Started

This should be able to run in your preferred IDE.  We used VS code for this project.

### Prerequisites
Before you get started, make sure you have the following software installed on your computer:

- [Node.js](https://nodejs.org/en/)

### Installation

1. Fork the repository.
2. Copy the SSH key in your new repository.
3. In your terminal type…git clone {paste SSH link}
4. Navigate into the repository’s folder in your terminal.
5. Open VS Code (or your editor of choice) and open the folder.
6. In the terminal of VS Code run npm install to install all the dependencies.
7. Create a .env file at the root of the project and past this line into the file:
8. Create a database named deal_lab_proto in PostgreSQL. If you would like to name your database something else, you will need to change deal_lab_proto to the name of your new database name in the server/modules/pool.js
9. The queries in the database.sql file are set up to create all the necessary tables that you need, as well as a dummy data table to test the app. Copy and paste those queries in the SQL query of the database. If this is going to production, leave out the dummy data.
10. Run npm run server in your VS Code terminal.
11. Open a second terminal and run npm run client

## Usage

Once everything necessary is installed and running, it should open up in your browser.  If not, navigate to http://localhost:5173/#/

Video walkthrough of our application can be viewed at: ENTER VIDEO LINNNNNKKKK

## Deployment

- Login credentials for Heroku have been provided in the hand off document.
- If you need to make changes you wish to push to the deployed app, you must login, go to the ___ section, go to the deploy tab, and then manually deploy. You can reconfigure this to redeploy automatically if you wish, which is on the same page.
- Environment variables are kept on Heroku in the Settings tab; just click the Reveal Config Vars button
- To set up the DB, we used Postico, just plug the information from Heroku into a new favorite.The information for this can be found in the Resources tab, by clicking the Postgres add on. From there it will bring you to a new page where you will go into the settings tab and click view credentials.
- If you’d like to create new users, you must 
1. Go into the user router
1. Uncomment the route
1. Push changes and redeploy app
1. Register User
1. Commend out the route back in VS Code
1. Push changes
1. Redeploy