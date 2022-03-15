import cleanRequest from "clean-request";
import spiderCore from "spider-core";

import { _2CaptchaToken } from "../../config";

const { sleep } = spiderCore;

export const startSolving = (base64Img, body = {}) => {
    return new Promise((resolve) => {
        cleanRequest({
            url: "http://2captcha.com/in.php",
            method: "POST",
            body: {
                key: _2CaptchaToken,
                method: "base64",
                body: base64Img,
                regsense: "1",
                numeric: "4",
                ...body,
                json: "1",
            },
        })
            .then(({ statusCode, data }) => {
                if (statusCode !== 200) {
                    console.error("Captcha solving request could not be initiated", statusCode, data);
                    return resolve("");
                }

                if (typeof data !== "object") data = JSON.parse(data);
                const { status, request } = data;
                if (status !== "1" && status !== 1) {
                    console.error("Captcha request not available", data);
                    return resolve("");
                }

                resolve(request);
            })
            .catch((err) => {
                console.error("Unable to make captcha solving request", err);
                resolve("");
            });
    });
};

export const getCaptchaResult = (captchaId, runTimes = 0) => {
    return new Promise((resolve) => {
        cleanRequest({
            url: `http://2captcha.com/res.php?key=${_2CaptchaToken}&action=get&id=${captchaId}&json=1`,
        })
            .then(({ statusCode, data }) => {
                if (statusCode !== 200) {
                    console.error("Getting captcha result request could not be started", statusCode, data);
                    return resolve("");
                }

                if (typeof data !== "object") data = JSON.parse(data);
                const { status, request } = data;
                if (status !== "1" && status !== 1) {
                    console.error("Captcha result not yet processed", data);

                    if (runTimes < 24)
                        return sleep(5 * 1000)
                            .then(() => getCaptchaResult(captchaId, runTimes + 1))
                            .then(resolve);

                    return resolve("");
                }

                resolve(request);
            })
            .catch((err) => {
                console.error("Unable to get captcha result", err);

                if (runTimes < 24)
                    return sleep(5 * 1000)
                        .then(() => getCaptchaResult(captchaId, runTimes + 1))
                        .then(resolve);

                resolve("");
            });
    });
};

const solveNormalCaptcha = (page, imgCaptcha, inputCaptcha) => {
    return page
        .waitForSelector(imgCaptcha, { visible: true })
        .then((captchaCode) =>
            captchaCode.evaluate((captchaImg) => {
                const getBase64Image = (img) => {
                    var canvas = document.createElement("canvas");
                    canvas.width = img.width;
                    canvas.height = img.height;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0);
                    var dataURL = canvas.toDataURL("image/png");
                    return dataURL.replace(/^data:image\/(png|jpg|jpeg|pdf);base64,/, "");
                };

                return getBase64Image(captchaImg);
            })
        )
        .then(startSolving)
        .then((initId) => initId && getCaptchaResult(initId))
        .then((captchaResult) => {
            console.log({ captchaResult });
            if (captchaResult) return page.type(inputCaptcha, captchaResult);

            return solveNormalCaptcha(page, imgCaptcha, inputCaptcha);
        });
};

export default solveNormalCaptcha;
