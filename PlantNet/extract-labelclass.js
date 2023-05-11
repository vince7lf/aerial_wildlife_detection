// read file
const fs = require('fs');

const filePath = '/mnt/c/Users/vincent.le.falher/Downloads/plantnet300K_species_id_2_name_beautified.json'; // Replace with the actual file path

fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  const jsonObject = JSON.parse(data)
  // loop each key
  for (const key in jsonObject) {
    if (jsonObject.hasOwnProperty(key)) {
      // output each value
      process.stdout.write("\"" + jsonObject[key] + '",');
    }
  }
});
