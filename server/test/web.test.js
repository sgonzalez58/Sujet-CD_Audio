const puppeteer = require ('puppeteer')



describe('Test du site', () => {
    let browser;
    let page;
    const url = "http://localhost:3000/"

    beforeAll(async () => {
        browser = await puppeteer.launch({ headless: false })
        page = await browser.newPage()
        const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";
        await page.setUserAgent(userAgent);
        await page.setViewport({ width: 1280, height: 800 });
    })
    afterAll(async () => {
        await browser.close()
    })

    test("Ouverture de l'application", async () =>{

        await page.goto(url, {waitUntil : 'domcontentloaded'})

        const title = await page.title()

        expect(title).not.toEqual('localhost')
    })

    test("Ajout d'un cd", async () =>{
        await page.goto(url, {waitUntil : 'domcontentloaded'})

        await page.type("input[name=title]", 'Closer')
        await page.type("input[name=artist]", 'Chainsmokers')
        await page.type("input[name=year]", '2017')
        await page.click("button[type=submit]")
        await page.waitForNavigation()

        const title = await page.title()

        expect(title).toEqual('Vite + React')
    })

    test("Verifier la liste des cd", async () =>{
        
        await page.goto(url, {waitUntil : 'domcontentloaded'})

        const containersTitle = await page.$('h2');

        let wantedTitle;

        for (const title in containersTitle){
            if (title == 'Liste des CD 🎵'){
                wantedTitle = title;
            }
        }

        expect(wantedTitle).not.toBeNull()

        let listeCds = wantedTitle.nextElementSibling;

        if(listeCds.firstElementChild.tagName('p')){
            return expect(listeCds.firstElementChild.innerText).toEqual('Aucun CD disponible')
        }

        for(const cd of listeCds.children){
            expect(cd.tagName).toEqual('li');
            expect(cd.firstElementChild.innerText).not.toEqual('');
        }
    })
})