import https from 'https';
import { mkConfig, generateCsv, asString } from "export-to-csv";
import { writeFile } from "node:fs";
import { Buffer } from "node:buffer";
import { write } from 'fs';
import { debug } from 'console';

const csvConfig = mkConfig({ useKeysAsHeaders: true, filename: 'sposExport' });

const walletList = [{
  name: 'aff-initial',
  address: 'addr1q9puewjsf309lh63d0knc52mdmhkvc58gh8wvpplgamvcp0xs0uamkjh6tsg4djaqnugycc4c8hhqc6s9d0cfykqr4lslet7r9'
},
{
  name: 'aff-spos',
  address: 'addr1qx7y79jlawvqzpmr74d946szewzkq7utfqfjz6u3ywfq5579qatwjlpsjn8lq09u27c89juf8gcjcsglg9rzrxd6ytlq6cztry'
}]
const writeCSV = (fileName, dataArray) => {
    // Converts your Array<Object> to a CsvOutput string based on the configs
    const csv = generateCsv(mkConfig({ useKeysAsHeaders: true, filename: fileName }))(dataArray);
    const filename = `./output/${fileName}.csv`;
    const csvBuffer = new Uint8Array(Buffer.from(asString(csv)));

    // Write the csv file to disk
    writeFile(filename, csvBuffer, (err) => {
    if (err) throw err;
    console.log("file saved: ", filename);
    });
};

const getAddressDetails = async (walletAddress) => {
    return new Promise((resolve, reject) => {
    let data = [];
    let transactions = [];
    https.get(`https://beta-explorer-api.prime.mainnet.apexfusion.org/api/v1/addresses/${walletAddress}/txs?page=0&size=100&sort=`, async res => {
    res.on('data', d => {
        data.push(d); 
      });
      res.on('end', async () => {
        const allData = JSON.parse(Buffer.concat(data).toString());
        resolve([...Array(allData.totalPages).keys()].map(i =>getPage(walletAddress,i)));
    });
    }
    );
})
};

const getPage = async (walletAddress, page) => {
  return new Promise((resolve, reject) => {
    let data = [];
    https.get(`https://beta-explorer-api.prime.mainnet.apexfusion.org/api/v1/addresses/${walletAddress}/txs?page=${page}&size=100&sort=`, res => {
      let txData = [];
      res.on('data', d => {
        txData.push(d); 
       });
        res.on('end', function() {
          try {
              const parsedTx = JSON.parse(Buffer.concat(txData).toString()).data;
              resolve(parsedTx.map(tx => getTxDetails(walletAddress, tx.hash)));
          } catch(e) {
              reject(e);
    }
  }
  );
})
});
};


const getTxDetails = async (walletAddress, txHash) => {
  return new Promise((resolve, reject) => {
  let data = [];
  https.get(`https://beta-explorer-api.prime.mainnet.apexfusion.org/api/v1/txs/${txHash}`, async res => {
  res.on('data', d => {
      data.push(d);
    });
    res.on('end', function() {
      try {
         data = JSON.parse(Buffer.concat(data).toString());
        //  console.log(data);
         return resolve(prettyFyTransaction(walletAddress, data));
      } catch(e) {
          reject(e);
      }
  });
  }
  );
})
};

const prettyFyTransaction = (targetWallet, transaction) => {
   if (transaction.utxOs.inputs.find(utxo => utxo.address === targetWallet)) {  // Out Tx
    return transaction.utxOs.outputs.filter(out => out.address != targetWallet).map(out => {
      return {
        ...transaction.tx,
        addressesInput: [targetWallet],
        addressesOutput: [out.address],
        balance: out.value,
        multiInput: false
      }
    });

   } else { // In Tx
      return transaction.utxOs.outputs.filter(out => out.address === targetWallet).map(out => {
        return {
          ...transaction.tx,
          addressesInput: transaction.utxOs.inputs.map(i => i.address),
          addressesOutput: [targetWallet],
          balance: out.value,
          multiInput: transaction.utxOs.inputs.length > 1 
        }
      });

   }
  };

// {
//   hash: 'a04b5777770d5ecab8eefdba4a9017ee0c333729f17d42600269e81951bea5e4',
//   blockNo: 281716,
//   blockHash: '23d8269bce4d822b8310387f21dbd2ef4c07ca5ce97ebdc26a9ef32808e6809d',
//   epochNo: 56,
//   epochSlotNo: 79497,
//   slot: 23450697,
//   time: '2025/02/18 15:44:57',
//   addressesInput: [
//     'addr1q96pkgpu9deqmmqzpfw6006sts5pp3dn5ppksafjvuqmcftsz7j4e40yxmnk7zvqucpsjlk4uk5rdum3zfteqr6zka6sevfq95',
//     'addr1qx7hlumfnkqdsgr3pfwk29wt32a4n7tuxryrnue22nhan9584cyr3dakxv23uxf5dd2lth8ap84auzad5rhegs2crzhsf0r3az',
//     'addr1qxgznupgzrhyr3eeddu0wpm5t2kd89hy4tnmw0f0c0029p92x9hw0nl3qqt9tmmlt53283004dp4z8hc6k5eejhqu77sgz2n7n',
//     'addr1qyp3ntragf04dfshq8rfkedvlcqes4gh5spjsndza42xt9equ32378tdu47fj0aylma89g3e8uzhxy6qj4l70dhapassf00d30',
//     'addr1q87hytgqtkd2f0rkw7gq8qqayv4rj67ev5zzv00dy3uc5jyn8v2dmy3a9rvguzr62ey608ee4fw36evx3alu9cgtwcwsvzpgq8',
//     'addr1qxwa3z0tqankkdglzdnljudry0w4ztkeyv9csn4pt2lpu7d05c4avkfwefreh9m2tvyu9tqsm9u84987x3nnm028jtgq7nv4h2',
//     'addr1q8qcnzzjcv0japl9fkxardu003ed3yqnuh30ajckcj4u82zm59367xms3a8gm9f8xa0e39uv7a9qvgxqgcet88v4gt5svgx7em',
//     'addr1qxmqj54etuztayuf328m2zw37zg326tpqzwywed8kyxv7nm4llngqltuucf9fst5vlefv3qycpmh48l4h8y4ntncf0asupzl2k',
//     'addr1qxr8jj7azsj9xzxaldh9fppy2nm0n78zsuevga90yyzkkuy29n939fv2uv0gsj38wxvdmpnfgqg66kfhemf34dzrrxas8fdft6',
//     'addr1q9fl8dcteg4t5n90u9pzzlys06llhqvpy5uphf0jesdcrmer6f689kquyc5skn4t6ngdz8twwcpnz46972v6syws4fasq2jzmp',
//     'addr1qyual3892slleyqx9qrjdq26ttusq6enk4l89rph6g0qs8mhwj93qm4zr3wg76xe3hufu49qfuvkkrtgh3kcjqs0yuyqhr7dek',
//     'addr1q88f4dr2d0h0yfqdk30khakrg9yxn5e7ahzqf22aeuzqltq9mymzmx40szs0gu0y5mwrjrv6d2mndk9ewxlxc30mjmyq4pxhh6',
//     'addr1qxfsg0nachk9sq0zpuu9v45hm46atcn8svtk9w324erftvuguz3yu50fm0dgmw83cqtlf3ydn0tdvryvtwwa78jrwlqs8jkfrv'
//   ],
//   addressesOutput: [
//     'addr1w8rr4v7q24f62h965dc7vp3d0l8tlxddml8kf69e28snees347qzl',
//     'addr1wxjtaf6r695kfwj4spwqn58cluj0kscaz95x7wsvxd8c90cj4eh50',
//     'addr1wy8szkmehyae5lxppsrd5q8c9zmp84gq4spa3ffswfan8qs922ydu',
//     'addr1wy75ku2ruky7mwttp2dqry27vdu7hzam2r2w3ttr5d2wjqsntfewa',
//     'addr1wxe30ukgqu634mntkw2gar26z54s60f8t3vyl726f4jkz7g3q2e8f',
//     'addr1w8xk46la5klh6hgntv0xp8xy4tvmwypvxm534v6upv9e86gm6xmev',
//     'addr1w8hs333vmvvv6w85gfcg9d9retkdzwvwu93dcjqk4w4np5cnjr5km',
//     'addr1w8trgnf2nlmseh6pwh8yekjv6g63tc42e5ufzwzas4qey9qmpv0d6',
//     'addr1wyxv0kjvgjm7ulj0l3epu3jptcfkrajnn2rc9g68awzmu7q3u6n6c',
//     'addr1wygkkppe29csrk9tg0pka0kx25g9uh7nnvkt03xyuj8dptqxxumvu',
//     'addr1w938l4sn2k2tlxn3s0wpe2qn25u7nnthh6cyyhaqqhxxnjsshg7sg',
//     'addr1w9h3lx34j8wwvsn3v3jgyuljh9hyllryv8l2ujl7nrfdq2sz6jhkj',
//     'addr1qyual3892slleyqx9qrjdq26ttusq6enk4l89rph6g0qs8mhwj93qm4zr3wg76xe3hufu49qfuvkkrtgh3kcjqs0yuyqhr7dek',
//     'addr1q96pkgpu9deqmmqzpfw6006sts5pp3dn5ppksafjvuqmcftsz7j4e40yxmnk7zvqucpsjlk4uk5rdum3zfteqr6zka6sevfq95',
//     'addr1qxr8jj7azsj9xzxaldh9fppy2nm0n78zsuevga90yyzkkuy29n939fv2uv0gsj38wxvdmpnfgqg66kfhemf34dzrrxas8fdft6',
//     'addr1q87hytgqtkd2f0rkw7gq8qqayv4rj67ev5zzv00dy3uc5jyn8v2dmy3a9rvguzr62ey608ee4fw36evx3alu9cgtwcwsvzpgq8'
//   ],
//   fee: 1000000,
//   totalOutput: 2217924957000000,
//   balance: 1052579593000000,
//   tokens: []
// },

const prettyfyTransactions = (wallet, tx) => {
  let txData = {
    date: tx.time,
    transactionId: tx.hash,
    token: 'AP3X',
    feeToken: 'AP3X',
    // addressesInput: tx.addressesInput,
    // addressesOutput: tx.addressesOutput,
    fee: tx.fee/1000000,
    amount: tx.balance/1000000,
    multiInput: tx.multiInput
  }
   if (tx.addressesInput.includes(wallet)) {  // Out Tx
    txData['direction'] = 'out';
    txData['type'] = 'withdrawal';
    txData['walletFrom'] = wallet;
    txData['walletTo'] = tx.addressesOutput.filter(address => address !== wallet).join(',');
   } else { // Input Tx
    txData['direction'] = 'in';
    txData['type'] = 'deposit';
    txData['walletTo'] = wallet;
    txData['walletFrom'] = tx.addressesInput.filter(address => address !== wallet).join(',');
   }

   return txData
}

const getWalletsData = async () => {
  const walletsData = await Promise.all(walletList.map(async wallet => {
            console.log(`Getting data for wallet ${wallet.name}`);
            const walletData = await getAddressDetails(wallet['address']);
            Promise.all(walletData).then(data => {
              Promise.all(data.flat()).then(transactions => {
                const p = transactions.flat().map(tx => prettyfyTransactions(wallet.address, tx));
                writeCSV(`${wallet.name}_${wallet.address}`, p);
              }
              )
            });
            }));
          };

getWalletsData();