/**
 * localStorage based database simulation utility
 */

const PREFIX = 'skillverse_';

const initializeDB = () => {
  const collections = ['users', 'posts', 'comments', 'courses', 'profiles', 'onboarding'];
  collections.forEach(collection => {
    if (!localStorage.getItem(`${PREFIX}${collection}`)) {
      localStorage.setItem(`${PREFIX}${collection}`, JSON.stringify([]));
    }
  });

  if (!localStorage.getItem(`${PREFIX}session`)) {
    localStorage.setItem(`${PREFIX}session`, JSON.stringify(null));
  }
};

export const getData = (collection) => {
  try {
    const data = localStorage.getItem(`${PREFIX}${collection}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading ${collection} from storage`, error);
    return null;
  }
};

export const setData = (collection, data) => {
  try {
    localStorage.setItem(`${PREFIX}${collection}`, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error writing to ${collection} in storage`, error);
    return false;
  }
};

export const updateData = (collection, id, updates) => {
  try {
    const data = getData(collection);
    if (!Array.isArray(data)) return false;

    const index = data.findIndex(item => item.id === id);
    if (index === -1) return false;

    data[index] = { ...data[index], ...updates };
    return setData(collection, data);
  } catch (error) {
    console.error(`Error updating item ${id} in ${collection}`, error);
    return false;
  }
};

export const addData = (collection, item) => {
  try {
    const data = getData(collection) || [];
    const newItem = { ...item, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    data.push(newItem);
    setData(collection, data);
    return newItem;
  } catch (error) {
    console.error(`Error adding item to ${collection}`, error);
    return null;
  }
};

export const deleteData = (collection, id) => {
  try {
    const data = getData(collection);
    if (!Array.isArray(data)) return false;

    const filteredData = data.filter(item => item.id !== id);
    return setData(collection, filteredData);
  } catch (error) {
    console.error(`Error deleting item ${id} from ${collection}`, error);
    return false;
  }
};

// Auto-initialize DB structures on load
initializeDB();
