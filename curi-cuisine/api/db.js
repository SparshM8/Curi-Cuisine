
const fs = require('fs/promises');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../../db.json');

const defaultData = {
  ingredients: [
    { id: 'apple', name: 'Apple', category: 'Fruit' },
    { id: 'banana', name: 'Banana', category: 'Fruit' },
    { id: 'chicken_breast', name: 'Chicken Breast', category: 'Meat' },
    { id: 'carrot', name: 'Carrot', category: 'Vegetable' },
    { id: 'rice', name: 'Rice', category: 'Pantry' },
    { id: 'olive_oil', name: 'Olive Oil', category: 'Pantry' },
    { id: 'garlic', name: 'Garlic', category: 'Vegetable' },
    { id: 'onion', name: 'Onion', category: 'Vegetable' },
  ],
  statistics: {
    mealsSaved: 0,
    wasteReduced: 0,
    recipesTried: 0,
  },
  recipes: [],
};

const store = {
  data: defaultData,
  async read() {
    try {
      const content = await fs.readFile(DB_PATH, 'utf-8');
      this.data = JSON.parse(content);
    } catch (err) {
      if (err.code === 'ENOENT') {
        await fs.writeFile(DB_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
        this.data = defaultData;
      } else {
        throw err;
      }
    }
  },
  async write() {
    await fs.writeFile(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
  },
};

module.exports = store;
