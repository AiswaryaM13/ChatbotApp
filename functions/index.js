'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');
const {Table, Image, Button, BasicCard, SignIn} = require('actions-on-google');

let accounts = [
  ['ais', 'AE07893830364644074996'],
  ['santhosh', 'AE07598142482696074322']
];

let accountsMap = new Map(accounts)

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const axios= require('axios');
let sandBoxToken="Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiIsImtpZCI6ImVuYmQtYXNwc3AtZWMifQ.eyJpc3MiOiJodHRwczovL2FwaS5lbWlyYXRlc25iZGxhYi5jb20vYXMvdG9rZW4ub2F1dGgyIiwidG9rZW5fdXNlIjoiYWNjZXNzIiwic2NvcGUiOiJmaW50ZWNoIiwiYXVkIjoiNGM2YWJqazNwODlzYXRtZHF1ZXZnZm5lZWQiLCJzdWIiOiJRenRQSFNqZFpUIiwianRpIjoiNDdkOGRmMDEzMWZkNzkzZCIsImlhdCI6MTU2NzMyOTMyMiwiZXhwIjoxNTY3Njg5MzIyfQ.yWl3EKAutJK5fbLqT0kaQT-m9HvoCflXFyqnnLpyEA1QWUeQe8Rg8GOYEYUUstBorFjUWIzBpmmQbf08-pQE1w";
//let sandBoxURL="https://api.emiratesnbdlab.com/accountV1/accounts/account-balance/AE07893830364644074996";
let sandBoxURL="https://api.emiratesnbdlab.com/accountV1/accounts/account-balance/";

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));


  function welcome(agent) {
    let conv=agent.conv();
     conv.ask(new SignIn('Hi there! Welcome to Emirates NBD Voice Banking. To use our services, you will have to first login with your Emirates NBD account'));
     agent.add(conv);
  }

  function handleGreetings(agent) {
    agent.add(`Welcome to the banking chatbot application! How can I help you?`);
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function handleAbuses(agent) {
    agent.add(`We are very sorry about your experience. We will work to correct it as soon as possible`);
  }

  function handleAppreciations(agent) {
    agent.add(`Thank you for your feedback. We wish to continue serving you the same way!`);
  }

  function handleGoodbye(agent) {
    agent.add(`Thank you for using our service. Hoping to see you soon!`);
  }

  function handleHelp(agent) {
    agent.add(`For help, go to http://www.xyz.com`);
  }

  async function handleBalanceInquiry(agent){

    var sandBoxFullURL='';

    const accessToken = request.body.originalDetectIntentRequest.payload.user.accessToken

    if (accessToken !== 'null' && typeof accessToken !=='undefined') {
      var userName = await getUserName(accessToken);
      console.log("user name is: "+ userName);
      var accountNo = accountsMap.get(userName);
      console.log("account number is: "+ accountNo);
      sandBoxFullURL=sandBoxURL+accountNo;
    }

    let conv = agent.conv();
    var sandBoxHeaders = {
      headers: {
            authorization: sandBoxToken
          }
        }
    try{
      console.log("About to call SandBox");
      var resp= await axios.get(sandBoxFullURL, sandBoxHeaders)
      console.log("Returned from SandBox"+JSON.stringify(resp.data));
      var balanceAmount=resp.data.balance;
      console.log("balance amount is: "+ balanceAmount);
      conv.ask('Here is your current account balance for account ending in 1234:');
      conv.ask(new BasicCard({
        text: `Your checking account has a current account balance of AED 1000.00 \n  for account ending in 1234`,
        subtitle: 'Checking Account',
        title: "AED " + balanceAmount,
        buttons: new Button({
        title: 'To check your account in detail',
        url: 'https://login.emiratesnbd.com/',
      }),
        image: new Image({
          url: 'https://i.ibb.co/tMxDrdM/enbdLogo.jpg',
          alt: 'Image alternate text',
        }),
        display: 'CROPPED',
    }));
    agent.add(conv);
    } catch(err){
      console.log("EXCEPTION CAugHJT @@@!! :: "+err.stack)
    }
  }



  function handleTransactionHistory(agent) {
    let conv = agent.conv();
    conv.ask('Here are the last 3 transactions performed on your Account ending with 1234:');
    conv.ask(new Table({
      title: 'AED 8,000.00',
      subtitle: 'Available Balance',
      image: new Image({
        url: 'https://i.ibb.co/tMxDrdM/enbdLogo.jpg',
        alt: 'ENBD',
      }),
      columns: [
        {
          header: 'Description',
        },
        {
          header: 'AMOUNT',
          align: 'LEADING',
        },
      ],
      rows: [
        {
          cells: ['TIM HORTONS DUBAI ARE \n 17-05-2019', '-15 AED'],
        },
        {
          cells: ['POS-PURCHASE \n 16-06-2019', '-124.31 AED'],
        },
        {
          cells: ['ATM WITHDRAWAL \n 14-05-2019', '-3000 AED'],
        },
      ],
      buttons: new Button({
        title: 'To see all transactions',
        url: 'https://login.emiratesnbd.com/',
      }),
    }));
    agent.add(conv); // Add Actions on Google library responses to your agent's response
  }


  async function getUserName(accessToken) {
  // var userName = ""
   let auth0URL = 'https://dev-vabwallz.auth0.com/userinfo';
   var auth0headers = {
     headers: {
             authorization: 'Bearer '+accessToken
           }
   }
   try {
     var auth0response = await axios.get(auth0URL, auth0headers)
     console.log('Response from Auth0:: '+JSON.stringify(auth0response.data))
    // userName = auth0response.data.nickname
   }
   catch(err) {
     console.log("Error from Auth0 :: "+err.stack)
   }
   return auth0response.data.nickname;
 }



  async function handleSignedIn(agent)  {
    let conv=agent.conv();
    console.log("signed in "+JSON.stringify(request.body));
    const accessToken = request.body.originalDetectIntentRequest.payload.user.accessToken
    if (accessToken !== 'null' && typeof accessToken !=='undefined') {
      var userName = await getUserName(accessToken);
      console.log("user name is: "+ userName);
      console.log('Access Token AFTER user signed in :: '+accessToken)
      conv.ask('Hello ' + userName +  ' !. Welcome to Emirates NBD Chat Banking. How can we help you?')
    } else {
      conv.ask(`We won't be able to help you with accessing your account details unless you have signed in. Please login with your Emirates NBD account`)
    }
    agent.add(conv);
 }


  // Run the proper function handler based on the matched Dialogflow intent name
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Greetings', handleGreetings);
  intentMap.set('Abuses', handleAbuses);
  intentMap.set('Appreciations', handleAppreciations);
  intentMap.set('Transaction History', handleTransactionHistory);
  intentMap.set('Goodbye', handleGoodbye);
  intentMap.set('Help', handleHelp);
  intentMap.set('Balance Inquiry', handleBalanceInquiry);
  intentMap.set('SignedIn', handleSignedIn);
  agent.handleRequest(intentMap);
});
