/**
 * @name         sCD
 * @namespace    none
 * @version      1.0.0
 * @description  Batch Soundcloud Downloader
 * @author       Timi Aiyemo
 * @example      node server.js {artist}
 */

const https = require('https');
const fs = require('fs');
const base = 'https://api.soundcloud.com';
const clientid = '2412b70da476791567d496f0f3c26b88';

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

const run = async artist => {
    const userid = await getuserid(artist);
    const tracks = await gettracks(userid);

    forEachAsync(tracks, async track => {
        const { title, stream_url, original_format } = track;
        const name = `${title}.${original_format}`;

        const streamarray = await getstreamarray(stream_url);
        await savestreamtofile(name, streamarray);
    });
};

run();
