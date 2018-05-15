require('dotenv').config();
var knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
  }
});
var request = require('request');
var async = require('async');
var nodemailer = require('nodemailer');
var express = require('express')
var bodyParser = require('body-parser')
var multer = require('multer')
var logger = require('morgan')

var app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(logger('dev'))


knex.schema.hasTable('rirs_kobo_email').then(function (exists) {
  if (!exists) {
    return knex.schema.createTable('rirs_kobo_email', function (t) {
      t.increments('id').primary();
      t.unique('uuid');
      t.string('uuid');
      t.text('body');
      t.string('email');
      t.timestamps();
    })
  }
})


function forActivity(el) {
  if (el === 'CBRM_DRR') {
    return 'CBDRM/DRR';
  } else {
    return el.replace('_', ' - ');
  }
}

function issueType(el) {
  if (el === "Dist_Timeliness") {
    el = 'Distribution Timeliness';
  } else if (el === "DCM") {
    el = 'Dist: Center Management';
  } else if (el === "Benef_Veri") {
    el = 'Beneficiary Verification'
  } else if (el === "Ent_Veri") {
    el = 'Entitlement Verification';
  } else if (el === 'Food_assist_mgm') {
    el = 'Food Assistance Management';
  } else if (el === 'Activity_design_mgm') {
    el = `FFA/FFT Activity Design and Management`;
  } else if (el === 'Activity_progress') {
    el = `FFA/FFT Activity Progress`;
  } else if (el === `School_records`) {
    el = `School Records`
  } else {
    el = el;
  }
  return el;
}

function dcm(el) {
  var x;
  if (el === 'cp_staff') {
    x = `CP Staff`
  } else if (el === 'protection') {
    x = `Protection`
  } else if (el === 'IEC_material') {
    x = 'IEC Material';
  } else if (el === 'Corruption') {
    x = 'Corruption';
  } else if (el === 'Mgm_comittee_HG') {
    x = 'Management Committee/Health Group';
  } else if (el === 'HC_mgm') {
    x = 'Health Center Management';
  } else if (el === 'Nutrition_msg') {
    x = 'Nutrition Messaging';
  } else if (el === 'IYCF_corner') {
    x = 'IYCF Corner (CMAM)';
  } else if (el === 'CMAM_performace') {
    x = 'CMAM Performance';
  } else {
    x = el;
  }
  return x;
}


function fam(el) {
  if (el === "Food_Deliver") {
    return 'Food Delivery';
  } else if (el === " Food_Storage") {
    return 'Food Storage';
  } else if (el === "Food_Quality") {
    return 'Food Quality';
  } else if (el === 'Food_stock') {
    return 'Food Stocks';
  } else if (el === 'Cash_delivery') {
    return 'Cash delivery'
  } else {
    return 'Cash Balance'
  }
}

function sr(el) {
  if (el === ' change_in_enroll') {
    return 'Change in enrolement';
  } else if (el === 'attend_Dist_record') {
    return 'Attendance and Distribution Record';
  } else {
    return 'Head Count';
  }

}
// formating json to email requirement
function ebody(el) {
  var elKeys = Object.keys(el);
  var myBody = `Priority:${el.Issue_priority}\nIssue Category: ${issueType(el.Main_Issue_Types)}\n`;
  // if(elKeys.includes('Dist_Center_Manage_subCat') || elKeys.includes('Dist_Center_Manage_subCat') || )
  if (el.Dist_Center_Manage_subCat) {
    myBody += `Issue Sub Category: ${ dcm(el.Dist_Center_Manage_subCat) }\n`;
  } else if (el.Food_Assistance_Managemen_SubC) {
    myBody += `Issue Sub Category: ${ fam(el.Food_Assistance_Managemen_SubC) }\n`;
  } else if (el.Activity_Design_SubCat) {
    myBody += `Issue Sub Category: ${el.Activity_Design_SubCat}\n`;
  } else if (el.School_Records_SubCat) {
    myBody += `Issue Sub Category: ${ sr(el.School_Records_SubCat) }\n`
  } else {
    myBody = myBody;
  }
  myBody += `Description: ${el.Brief_description_of_Issue}\n\nActivity:${forActivity(el.Activity)}\nCP:${el.CP_Name}\nProvince:${el.province}\nDistrict:${el.district}\nTehsil:${el.Tehsil}\nUC:${el.UC}\nVillage/Location: ${el.Village_Distribution_Site}\nGPS:{"lat"=>${el._geolocation[0]}, "lon"=>${el._geolocation[1]}}\nP Code:${el.P_Code}\nReported By:${el.Field_monitor}\nFocal:${el.Issue_Assigned_to}`;
  return myBody;
}

// create reusable transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL, // generated ethereal user
    pass: process.env.EMAIL_PASS // generated ethereal password
  }
});

// options
function mailOpts(el) {
  // setup email data with unicode symbols
  let mailOptions = {
    from: `RIRS - WFP Pakistan ${process.env.EMAIL}`, // sender address
    to: 'wfp.help.pak@gmail.com', // list of receivers
    subject: 'Issue Reported', // Subject line
    // html: 'Hello world?', // plain text body
    text: ebody(el) // html body
  };
  return mailOptions;
}
// Query and Email
knex('rirs_kobo')
  .where({
    uuid: 'ffd7d3f3-a627-404f-847c-6af860d232c2'
  })
  .then(single => {
    var dd = JSON.parse(single[0].body);
    console.log(dd);

    
  })
app.get('/', (req, resp)=>{
  resp.json({'msg':'RIRS email utility'});
})
app.post('/email', (req, resp)=>{
  // send mail with defined transport object
  transporter.sendMail(mailOpts(req.body), (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  });
})

  app.listen(process.env.PORT, (err)=>{
    if(err) return console.log(err);
    console.log(`Server Started at :${process.env.PORT}`)
  });
  