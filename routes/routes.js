const express = require("express");
const router = express.Router();
const { google } = require("googleapis");


router.get('/', async(req, res) => {
    const auth = new google.auth.GoogleAuth({
    keyFile: "keys.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    // Create client instance for auth
    const client = await auth.getClient();

    // Instance of Google Sheets API
    const googleSheets = google.sheets({ version: "v4", auth: client });
    if(!req.query.spreadsheet_id){
        res.send({message : "Pass spreadsheet_id in params"})
    }
    const spreadsheetId = req.query.spreadsheet_id;

    let metaData

    await googleSheets.spreadsheets.get({
        auth,
        spreadsheetId,
    }).then(res => metaData = res).catch(err => {
        res.status(400).send({error: 'invalid spreadsheet_Id'})
    })

    const sheets = metaData.data.sheets
    let sheet_ids = []
    let sheet_title = []

    for(let i=0;i<sheets.length;i++){
        sheet_ids.push(sheets[i].properties.sheetId)
        sheet_title.push(sheets[i].properties.title)
    }
    let data = []

    for(let j=0;j<sheet_title.length;j++){
        const getRows = await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId,
            range: `${sheet_title[j]}`,
        });
        data.push(getRows.data)
    }

    let dataMapping = {};

    for(let z=0;z< data.length;z++){
        const sheetName = sheet_title[z]
        const table = data[z].values
        let tempTableData = []
        for(let row =0;row<table.length;row++){
            const rowData = table[row]
            let tempMap = {};
            for(let col =0;col< rowData.length;col++){
                const colData = rowData[col]
                tempMap[col] = colData
            }
            tempTableData.push(tempMap)
        }
        dataMapping[sheetName] = tempTableData
    }
    res.send(dataMapping)
})

router.post("/", async (req, res) => {
    const { value , spreadsheet_id, sheet_id, row_number, column_number } = req.body;

    if(!value) {
        res.status(400).send({error: 'value field is missing in body of requset'})
    }
    if(!spreadsheet_id) {
        res.status(400).send({error: 'spreadsheet_id field is missing in body of requset'})
    }
    if(!sheet_id) {
        res.status(400).send({error: 'sheet_id field is missing in body of requset'})
    }
    if(!row_number) {
        res.status(400).send({error: 'row_number field is missing in body of requset or is less than 0'})
    }
    if(!column_number) {
        res.status(400).send({error: 'column_number field is missing in body of requset or is less than 0'})
    }
  
    const auth = new google.auth.GoogleAuth({
      keyFile: "keys.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets",
    });
  
    // Create client instance for auth
    const client = await auth.getClient();
  
    // Instance of Google Sheets API
    const googleSheets = google.sheets({ version: "v4", auth: client });
  
    const spreadsheetId = spreadsheet_id;
    let metaData

    await googleSheets.spreadsheets.get({
        auth,
        spreadsheetId,
    }).then(res => metaData = res).catch(err => {
        res.status(400).send({error: 'invalid spreadsheet_Id'})
    })
    

    const sheets = metaData.data.sheets
    let sheet_title = ''

    let sheet_id_found = false
    for(let i=0;i<sheets.length;i++){
        if(sheets[i].properties.sheetId === sheet_id) {
            sheet_title = sheets[i].properties.title
            sheet_id_found = true
        }
    }

    if(!sheet_id_found) {
        res.status(400).send({error: 'invalid sheet_Id'})
    }

    await googleSheets.spreadsheets.values.update({
      auth,
      spreadsheetId,
      range: `${sheet_title}!R${row_number}C${column_number}:R${row_number}C${column_number}`,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[value]],
      },
    });
  
    res.status(200).send({success: true});
  });

  module.exports = router;