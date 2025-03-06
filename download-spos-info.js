import https from 'https';
import { mkConfig, generateCsv, asString } from "export-to-csv";
import { writeFile } from "node:fs";
import { Buffer } from "node:buffer";
import { write } from 'fs';
import { debug } from 'console';

const csvConfig = mkConfig({ useKeysAsHeaders: true, filename: 'sposExport' });

const writeCSV = (dataArray) => {
    // Converts your Array<Object> to a CsvOutput string based on the configs
    const csv = generateCsv(csvConfig)(dataArray);
    const filename = `output/${csvConfig.filename}.csv`;
    const csvBuffer = new Uint8Array(Buffer.from(asString(csv)));

    // Write the csv file to disk
    writeFile(filename, csvBuffer, (err) => {
    if (err) throw err;
    console.log("file saved: ", filename);
    });
};

// const getSPODetails = async (spo) => {
//     return new Promise((resolve, reject) => {
//     let data = [];
//     https.get(`https://beta-explorer-api.prime.testnet.apexfusion.org/api/v1/delegations/pool-detail-header/${spo.poolId}`, async res => {
//     res.on('data', d => {
//         data.push(d);
//       });
//       res.on('end', function() {
//         try {
//            data = JSON.parse(Buffer.concat(data).toString());
//         } catch(e) {
//             reject(e);
//         }
//         console.log(data);
//         const { rewardAccounts, ownerAccounts, ...rest } = data; //Fields to remove
//         resolve(rest);
//     });
//     }
//     );
// })
// };

const getSPOsfromAPI = () => {
    const options = {
        hostname: 'osam.apexfusion.org',
        path: '/api/networks/prime/pool-statistics',
        method: 'GET',
      };
    
    https.get( options, res => {
      let data = [];
      console.log('Status Code:', res.statusCode);
      res.on('data', d => {
        data.push(d);
      });
      res.on('end', async () => {
        console.log('Response ended: ');
        const spoList = JSON.parse(Buffer.concat(data).toString());

    //    const spos = await Promise.all(.map(async spo => {
    //     return await getSPODetails(spo)
    //     }));
        writeCSV(spoList['data']['pools']);
      })
    }).on('error', err => {
      console.log('Error: ', err.message);
    });
}

getSPOsfromAPI();