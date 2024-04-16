const { indexIdf } = require("./bin/idxIdf");
const { indexTf } = require("./bin/idxTf");
const { crawler } = require("./bin/crawl");
const { start } = require("./bin/lib");
const args = require("yargs").argv;

const main = (server) => {
    crawler((e, urlFile) => {
        indexTf(urlFile.col, (e, tfFile) => {
            indexIdf(tfFile.col, (e, res) => {
                console.log('res: ', res);
                server.close()
            })
        }) 
    })
}

start(args.nodesConfig || "data/nodesConfig.json", main);

