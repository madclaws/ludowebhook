'use strict'
const express = require('express');
const request=require('request');
const body_parser = require('body-parser');
const shell=require('shelljs');
const app=express().use(body_parser.json());
app.listen(1337,'0.0.0.0',()=>console.log("WebHook is listening"));
app.post('/webhook',(req,res)=>{
	let body=req.body;
	if(body.object==="page"){
		body.entry.forEach((entry)=>{
			let webhook_event=entry.messaging[0];
			console.log(webhook_event);
			let sender_psid=webhook_event.sender.id;
			//console.log("sender Id",sender_psid);
			if(webhook_event.message){
				handleMessage(sender_psid,webhook_event.message);
			}
			else if(webhook_event.postback){
				handlePostback(sender_psid,webhook_event.postback);
			}
			else if(webhook_event.game_play){
				handleGameplay(sender_psid,webhook_event.game_play);
			}
			});
	res.status(200).send('EVENT_RECEIVED');
	}
	else{
		res.sendStatus(404);
	}
});
app.get('/webhook',(req,res)=>{
	let VERIFY_TOKEN=process.env.PAGE_ACCESS_TOKEN;
	let mode=req.query['hub.mode'];
	let token=req.query['hub.verify_token'];
	let challenge=req.query['hub.challenge'];
	if(mode && token){
		if(mode==='subscribe' && token === VERIFY_TOKEN){
			console.log("WEBHOOK VERIFIED");
			res.status(200).send(challenge);
		}
		else{
			res.sendStatus(403);
		}
	}
});

function handleMessage(sender_psid,receivedMessage){
	console.log(sender_psid,receivedMessage);
	let response;
	if(receivedMessage.text){
		response={
			"text":'You send me a message like '+receivedMessage.text+' !'
		}
	}
	callSendAPI(sender_psid,response);
};

function handleGameplay(sender_psid,receivedMessage){
	console.log("....handling game_play......");
	
	let fbpost="curl "+
	"'"+ "https://graph.facebook.com/v2.6/me/messages?access_token=EAACtKTHcf5sBAKuaWJBK6NBQAn9G8cGP8JYkeaRzUhxLpcHBVu9d0LFyxfip1nxHgVzUOV675fo2jnUPaW6fk"+
	"UGoSC3zwHKsDcKunvePwZBkM6dh1JIJZBGFcF5aZC2Jk0y8xsh3obOtezEehAgb9ecCSjr9WTrTX3vQrX4MgZDZD"+"'"+" -X POST -H "+"'"+"Content-Type: application/json"+"'"+ "-d"+ "'"+"{"+
		"'"+"messaging_type"+"':" +"'"+"UPDATE"+"',"+
		"'"+"recipient"+"':"+"{"+
		"'"+"id"+"':"+sender_psid+
		"},"+
		"'"+"message"+"':"+ "{"+
		"'"+"attachment"+"':"+ "{"+
		"'"+"type"+"':"+"'"+"template"+"',"+
			"'"+"payload"+"':"+"{"+
			"'"+"template_type"+"':"+ "'"+"generic"+"',"+
				"'"+"elements"+"':"+"["+
						"{"+
							"'"+"title"+"':"+"'"+ "It has been a while since your last game. Time to get back"+"',"+
							"'"+"buttons"+"':"+ "["+
								"{"+
									"'"+"type"+"':"+ "'"+"game_play"+"',"+
									"'"+"title"+"':"+ "'"+"Play Ludo With Friends."+"',"+
									"'"+"payload"+"':"+ "'"+"{}"+"',"+
									"'"+"game_metadata"+"':"+ "{"+
									"}"+
								"}"+
							"]"+
						"}"+
					"]"+
				"}"+
			"}"+
		"}}"+"'";

		shell.exec(fbpost);
		
	/* let response;
	response={
		"attachement":{
			"type":"template",
			"payload":{
				"template_type":"generic",
				"elements":[
					{
						"title":"Thanks for playing ludo",
						"buttons":[
							{
								"type":"game_play",
								"title":"Play Ludo With Friends",
								"payload":"{}",
								"game_metadata":{
								}	
							}
						]	
					}
				]
			}
		}
	}
	callSendAPI(sender_psid,response); */
};
function handlePostback(sender_psid,received_postback){

};

function callSendAPI(sender_psid,response){
	let request_body;
	request_body={
		"messaging_type":"UPDATE",
		"recipient":{
			"id":sender_psid
		},
		"message":response
	}
	request({
		"uri":"https://graph.facebook.com/v2.6/me/messages",
		"qs":{"access_token":process.env.PAGE_ACCESS_TOKEN},
		"method":"POST",
		"json":request_body
	},(err,res,body)=>{
		if(!err){
			console.log("message sent!");
		}
		else{
			console.log("unable to send message "+err);
		}
	});
};
