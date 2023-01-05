import fetch from 'node-fetch';
import fs from 'fs';

const url = 'https://calil.jp/city_list';
const apiKey = '7b38a6543c2d4423c00114f53f114655';

const librariesResponse = await fetch(`https://api.calil.jp/library?appkey=${apiKey}&format=json`);
const librariesText = await librariesResponse.text();
var librariesMatch = librariesText.match(/^callback\((.*)\);$/);
const libraries = JSON.parse(librariesMatch[1]);

const response = await fetch(url);
const text = await response.text();
const match = text.match(/^loadcity\((.*)\);$/);
const cities = JSON.parse(match[1]);

// 重複を排除 https://ginpen.com/2018/12/18/array-unique/
const uniqueArray = (array) => {
  return array.reduce((a, v) => {
    if (!a.some((e) => e.name === v.name && e.value === v.value)) {
      a.push(v);
    }
    return a;
  }, []);
}

for (const prefecture in cities) {
  for (const initialHiragana in cities[prefecture]) {
    const cityNames = cities[prefecture][initialHiragana];
    const array = cityNames.map((city) => {
      const targetLibrary = libraries.find(library => library.systemname === `${prefecture}${city}` && (library.category === 'MEDIUM' || library.category === 'SMALL'));
      if (targetLibrary) {
        return { name: city, value: targetLibrary.systemid };
      }
    });
    cities[prefecture][initialHiragana] = array.filter((item) => item);
  }
  const largeArray = libraries.filter(library => library.pref === prefecture && library.category === 'LARGE').map(library => { return { name: library.systemname, value: library.systemid }});
  cities[prefecture]['図書館(広域)'] = uniqueArray(largeArray);
  const univArray = libraries.filter(library => library.pref === prefecture && library.category === 'UNIV').map(library => { return { name: library.systemname, value: library.systemid }});
  cities[prefecture]['図書館(大学)'] = uniqueArray(univArray);
  const otherArray = libraries.filter(library => library.pref === prefecture && (library.category === 'SPECIAL' || library.category === 'BM')).map(library => { return { name: library.systemname, value: library.systemid }});
  cities[prefecture]['移動・その他'] = uniqueArray(otherArray);
}

try {
  fs.writeFileSync('build/libraries.json', JSON.stringify(cities, null, 2))
} catch (e) {
  console.log(e)
}
