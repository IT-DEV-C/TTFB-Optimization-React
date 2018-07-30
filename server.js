import express from 'express';
import compression from 'compression';
import React from 'react';
import {renderToString} from 'react-dom/server';
import {Head} from './app/components/head';
import {Header} from './app/components/header';
import {MainContent} from './app/components/mainContent';
import {Footer} from './app/components/footer';
import {Navigation} from './app/components/navigation';
import request from 'superagent';


const port = process.env.PORT || 8080 ,
server = express();

let globalData = {};

server.use(compression());
server.use(express.static('./public'));

var getHead = (req,res,next) => {
	res.set({
		'Content-Type': 'text/html; charset=UTF-8', //This is done to overcome the issue of minimum number of bytes needed to render the DOM in firefox.
	});
	res.write(`<!DOCTYPE html>
		<html>${renderToString(<Head/>)}`);
	res.flush();
	next();
}

var getHeader = (req,res,next) => {
	res.write(`<body><div id="root">${renderToString(<Header />)}`);
	res.flush();
	next();
}
var getNavigation = (req,res,next) => {
	let users = [];
	const getUsers = pageNumber => {
		request.get(`https://reqres.in/api/users?page=${pageNumber}`).then(res => {
			if(pageNumber !== 3) {
				users = [...users,...res.body.data];
				getUsers(++pageNumber);
			} else {
				sendHtml();
			}
		});
	}
	const sendHtml = () => {
		res.write(`${renderToString(<Navigation data={users} />)}`);
		res.flush();
		globalData.navigationList = users;
		next();
	}
	getUsers(1);
}

var getMainContent = (req,res,next) => {
	request.get("https://reqres.in/api/users?delay=2").then(response => {
		res.write(`${renderToString(<MainContent data={response.body.data} />)}`);
		res.flush();
		globalData.mainContent = response.body.data;
		next();
	});
}

var getFooter = (req,res) => {
	res.write(`${renderToString(<Footer />)}</div>
		</body>
		<script>window.dataLayer=${JSON.stringify(globalData)}</script>		
		<script src="../../bundle.js"></script>
		</html>`);
	res.flush();
	res.end();
}

server.get("/",[getHead,getHeader,getNavigation,getMainContent,getFooter]);

server.listen(port,()=>{
	console.log("express server is listing on configured port "+port);
});