require('dotenv').config();
var knex = require('knex')({
  client: 'mysql2',
  connection: {
    host : process.env.DB_HOST,
    user : process.env.DB_USER,
    password : process.env.DB_PASS,
    database : process.env.DB_DATABASE
  }
});
var express = require('express')
var bodyParser = require('body-parser')
var multer = require('multer')
var logger = require('morgan')

var app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
app.use(logger('dev'))


function ebody (el){
  var elKeys = Object.keys(el);
  var myBody = `Priority:${el.Issue_priority}\nIssue Category: ${el.Main_Issue_Types}\n`;
    if(el.Dist_Center_Manage_subCat) {
      myBody +=`Issue Sub Category: ${el.Dist_Center_Manage_subCat}\n`;
    }else if(el.Food_Assistance_Managemen_SubC){
      myBody +=`Issue Sub Category: ${el.Food_Assistance_Managemen_SubC}\n`;
    } else if (el.Activity_Design_SubCat){
      myBody +=`Issue Sub Category: ${el.Activity_Design_SubCat}\n`;
    } else if(el.School_Records_SubCat){
      myBody +=`Issue Sub Category: ${el.School_Records_SubCat}\n`
    } else {
      myBody += `Description: ${el.Brief_description_of_Issue}\n\nActivity:${el.Activity}\nCP:${el.CP_Name}\nProvince:${el.province}\nDistrict:${el.district}\nTehsil:${el.Tehsil}\nUC:${el.UC}\nVillage/Location: ${el.Village_Distribution_Site}\nGPS:{"lat"=>${el._geolocation[0]}, "lon"=>${el._geolocation[1]}}\nP Code:${el.P_Code}\nReported By:${el.Field_monitor}\nFocal:${el.Issue_Assigned_to}`;
    }
    return myBody;
}

app.post('/rirs_email', (req, resp)=>{
  console.log(ebody(req.body));
  var bKeys = [];
  Object.keys(req.body).forEach(el=>{
    bKeys.push(el);
  })
  var x = bKeys.filter(el=> !el.indexOf('_')<=0);
  console.log(x);
  resp.status(403).end();
})

app.listen(process.env.PORT, (err)=>{
  if(err) return console.log(err);
  console.log(`Server Started at :${process.env.PORT}`)
});
