const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({ headless: false });  // headless ustawione na false, żebyś mógł obserwować działanie w przeglądarce
    const page = await browser.newPage();

    //const wyszukaj = 'catering dietetyczny';
    //(optymalnie - wyszukiwanie)
    //await page.waitForSelector('#searchbox-input'); 
    //await page.type('#searchbox-input', wyszukaj);

    // Czekanie na załadowanie się strony po zalogowaniu (możesz dostosować to do twojego przypadku, np. czekając na konkretny element, który pojawia się po zalogowaniu)
    /*await Promise.all([
        await page.click('.searchbox__button'),  // na przykład przycisk, który powoduje nawigację
        page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);*/
    let pierwsza_podstrona = 2727;
    let ostatnia_podstrona = 3706;
    let podstrona = "https://aleo.com/pl/firmy/"+pierwsza_podstrona+"?phrase=catering%20dietetyczny";
    await page.goto(podstrona);  //odpalenie początkowej strony
    // pobieramy wszytskie znaczniki a
    for(let i = pierwsza_podstrona;i<ostatnia_podstrona;i++){
        const links = await page.$$eval('.catalog-row-first-line__company-name', links => links.map(link => link.href));
        let liczba_znalezionych = 0;
        for (let link of links) {
            try {
                // Otwórz każdy link w tej samej karcie
                await page.goto(link, { waitUntil: 'networkidle2', timeout: 60000 });
                const dane = new Array(5).fill(' - ');
                // Pobieramy nazwę kateringu
                const title = await page.$eval('.text-company-name', element => element.textContent);
                dane[0] = title;
                // Pobieramy nip kateringu
                const nip = await page.$eval('.registry-details__row__value', element => element.textContent);
                dane[1] = nip;
                // kontener ze szczegółowymi informacjami
                const div = await page.$(".contact-container");
                if(div){
                    const spanElements = await div.$$('span');
                    for (let spanElement of spanElements) {
                        const text = await page.evaluate(el => el.textContent, spanElement);
                        if(isDigit(text)){dane[3]=("+48"+text);}
                        else if(text.includes('@')){dane[2]=text;}
                        else{dane[4]=text;}
                    }
                }
                if(dane[2]==' - '&&dane[3]==' - '){}
                else{
                    liczba_znalezionych++;
                    await saveToExcel(dane);
                }
                podstrona = "https://aleo.com/pl/firmy/"+i+"?phrase=catering%20dietetyczny";
                await page.goto(podstrona);
                // Wróć do głównej strony
                //await page.goBack();
            } catch (error) {
                console.error("Wystąpił problem z załadowaniem strony: ", error);
                continue;
            }
        }
        console.log("liczba znalezionych wyników: "+liczba_znalezionych+" na "+podstrona);
    }
    console.log("zakończyłeś na podstronie: "+(ostatnia_podstrona-1));
    await browser.close();
})();

//zapis do pliku exel
const ExcelJS = require('exceljs');

async function saveToExcel(data) {
    const workbook = new ExcelJS.Workbook();

    let worksheet;

    // Spróbuj wczytać istniejący plik
    try {
        await workbook.xlsx.readFile('klienci.xlsx');
        worksheet = workbook.getWorksheet('klienci');
    } catch (error) {
        // Jeśli plik nie istnieje, utwórz nowy arkusz
        worksheet = workbook.addWorksheet('klienci');
        console.log('Nie znaleziono pliku klienci.xlsx. Tworzenie nowego arkusza "klienci".');
    }

    // Dodaj dane do arkusza
    worksheet.addRow(data);
    console.log(`Dodano dane: ${data.join(', ')}`);

    // Zapisz zmiany do pliku
    await workbook.xlsx.writeFile('klienci.xlsx');
    console.log('Plik klienci.xlsx został zapisany.');
}

//dodatkowe funkcje
function isDigit(char) {
    const code = char.charCodeAt(0);
    return code >= 48 && code <= 57;
}