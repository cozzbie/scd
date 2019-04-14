/**
 * @name         SCD
 * @namespace    none
 * @version      1.0.0
 * @description  Batch Soundcloud Downloader
 * @author       Timi Aiyemo
 * @example      node index.js {artist}
 */

const https = require('https');
const fs = require('fs');
const base = 'https://api.soundcloud.com';
const clientid = '2412b70da476791567d496f0f3c26b88';
const outputdir = './out';
const flags = ['--artist', '--track'];
const Spinner = require('cli-spinner').Spinner;

/**
 * Runs an init script that creates an output folder
 */
const init = () => {
    fs.stat(outputdir, (err, stats) => {
        if (err) {
            throw err;
        } else if (!stats.isDirectory()) {
            fs.mkdir(outputdir, err => {
                if (err) {
                    throw err;
                }
            });
        }
    });
};

/**
 * @description Names don't work too well when pulling requests. Fetch and store the ID instead.
 */
const getuserid = async name => {
    const url = `${base}/users/${name}?client_id=${clientid}`;
    const payload = await thensifystring(url);
    return payload.id;
};

/**
 * @description Endpoint to request track list of user.
 */
const gettracks = async userid => {
    const tracksurl = `${base}/users/${userid}/tracks?client_id=${clientid}`;
    return await thensifystring(tracksurl);
};

/**
 * @description Fetch the stream.
 */
const getstreamarray = async url => {
    const streamurl = `${url}/?client_id=${clientid}`;
    const cdnurl = await thensifystring(streamurl);
    return await thensifystream(cdnurl.location);
};

/**
 * @description Saves a stream to a file and returns the file.
 */
const savestreamtofile = (name, streamarr) => {
    return new Promise((resolve, reject) => {
        try {
            let file = fs.createWriteStream(`./out/${name}`);
            streamarr.forEach(v => file.write(v));
            file.end();

            resolve(file);
        } catch (e) {
            reject(e);
        }
    });
};

/**
 * @description Promise wrapper around https that returns strings
 */
const thensifystring = url => {
    return new Promise((resolve, reject) => {
        let chunk = '';
        https
            .get(url, res => {
                res.on('data', buff => (chunk += buff.toString('utf8')));
                res.on('end', () => resolve(JSON.parse(chunk)));
            })
            .on('error', err => reject());
    });
};

/**
 * @description Promise wrapper around https that returns streams
 */
const thensifystream = url => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        https
            .get(url, res => {
                res.on('data', buff => chunks.push(buff));
                res.on('end', () => resolve(chunks));
            })
            .on('error', err => reject());
    });
};

/**
 * @description Async/Await version for forEach
 * @param {Array} arr
 * @param {Function} cb
 */
const forEachAsync = async (arr, cb) => {
    for (let i = 0; i < arr.length; i++) {
        await cb(arr[i]);
    }
};

/**
 * @description Batch download an artists tracks
 * @param {string} name
 */

const batch = async artist => {
    const spinner = new Spinner('%s Processing batch download...');
    spinner.setSpinnerString(20);
    spinner.start();

    const userid = await getuserid(artist);
    const tracks = await gettracks(userid);

    forEachAsync(tracks, async track => {
        const { title, stream_url, original_format } = track;
        const name = `${title}.${original_format}`;

        const streamarray = await getstreamarray(stream_url);
        await savestreamtofile(name, streamarray);
    });

    spinner.stop();
    console.log('\nDone');
};

/**
 * @description Download a single song
 * @param {string} url
 */

const single = url => {
    console.log('Processing track download...');
    console.log('Done');
};

/**
 * Runs the command
 */

const run = () => {
    init();

    const [one, two, ...rest] = process.argv;
    const artistflag = flags[0];
    const urlflag = flags[1];

    switch (true) {
        case !!(rest.includes(artistflag) && rest[1]):
            batch(rest[1]);
            break;
        case !!(rest.includes(urlflag) && rest[1]):
            console.log('url', rest[1]);
            break;
        default:
            console.log('Nothing to run');
    }
};

run();
