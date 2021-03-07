const pup = require('puppeteer');
const userData = require('./cred.js');
const args = require('./arguments.js');

const url = 'https://www.instagram.com/';

async function login(page){

    const loginURl = 'https://www.instagram.com/accounts/login/?next=%2Flogin%2F&source=desktop_nav';

    await page.goto(loginURl);
    await page.waitForTimeout(1000);

    const elements = await page.$$('._2hvTZ');
    const logintBtn = await page.$('.sqdOP');

    //username input 
    await elements[0].click();
    await page.keyboard.type(userData.username);
    
    //password input
    await elements[1].click();
    await page.keyboard.type(userData.password);

    //click login
    await logintBtn.click()

    await page.waitForNavigation();

    return page;
}

let setup = async () => {
    const browser = await pup.launch({
        headless: false
    });
    const page = await browser.newPage();
    
    // return page;
    return login(page);
};

let run = async(page,arr) => {

    if (arr){
        await arr.forEachAsync(async item => {
            const handle = item?.handle;
            const tag = item?.tag;

            if (handle){
                const path = url + handle;
                await like(page,path,item.count,item.likeComments,item.visitUsers);
            }else if(tag){
                const path = url + 'explore/tags/' + tag; 
                await like(page,path,item.count,item.likeComments,item.visitUsers);
            }
        });
    }
}


let like = async (page, path, count, likeComments, visitUsers) => {

    await page.goto(path);
    await page.waitForTimeout(2000);

    const first = await page.$('.v1Nh3');
    await first.click();

    await page.waitForTimeout(1000);

    let range = n => [...Array(n).keys()]

    var handles = new Array(); 

    await range(count).forEachAsync(async _ => {

        //get user handle
        if (visitUsers){
            const handle = await page.$('div > h2 > div > span > .sqdOP');
            const user = await page.evaluate(el => el.textContent, handle);
            handles.push(user);
        }
        
        //arrow button
        const rightArrow = await page.$('.coreSpriteRightPaginationArrow');
        if (rightArrow){
            await rightArrow.click();
        }

        await page.waitForTimeout(1000);

        //check if previoulsy liked
        const liked = await page.$('svg[aria-label="Unlike"]');

        if (!liked){
            // like button
            const likeBtn = await page.$('.ltpMr > .fr66n > .wpO6b');
            if (likeBtn){
                await likeBtn.click();
            }
        }

        if (likeComments){
            await contentComments(page);
        }
        
        await page.waitForTimeout(1500);
    });

    if (visitUsers){
        await handles.forEachAsync(async handle => {
            const userPath = url + handle;
            await like(page,userPath,count,false,false);
        });    
    }

    // for(user in handles){
    //     console.log(`User path: ${url+handles[user]}`);
    // }

    await page.waitForTimeout(1000);    
}

let contentComments = async (page) => {
    const comments = await page.$$('.Mr508');
    console.log('Number of comments: ' + comments.length);
    if (comments){
        await comments.forEachAsync(async el => {
            const liked = await el.$('svg[aria-label="Unlike"]');
            
            if (!liked){
                if (random(2)){
                    const likeBtn = await el.$('._2ic5v > .wpO6b');
                    await likeBtn.click();
                    console.log('Liking comment');
                }
                
            }
            await page.waitForTimeout(750);
        });
    }
}

const userPage = async (page) => {
    const userHandle = await page.$('span[class="Jv7Aj"] > a.sqdOP');

}

const random = n => { return Math.floor(Math.random() * Math.floor(n)); }

(async () => {
    
    console.log('Inititalizing program...');
    const page = await setup();

    const users = args?.users;
    const tags = args?.tags;

    await run(page,users)

    await run(page,tags);
})();


Array.prototype.forEachAsync = async function(fn) {
    for (let t of this) {await fn(t) }
}


