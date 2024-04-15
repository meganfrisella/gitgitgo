const { indexIdf } = require("./bin/idxIdf");
const { indexTf } = require("./bin/idxTf");
const { crawler } = require("./bin/crawl");
const { start } = require("./bin/lib");
const args = require("yargs").argv;

const main = (server) => {
    crawler((e, urlFile) => {
        indexTf(urlFile.col, (e, tfFile) => {
            console.log(tfFile)
            server.close()
            // indexIdf(tfScores, (e, res) => {
            //     server.close()
            // })
        }) 
    })
}

start(args.nodesConfig || "data/nodesConfig.json", main);

