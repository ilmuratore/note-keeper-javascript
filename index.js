
/*
 * Note Keeper 
  No GUI, only CLI app.
  Javascript and Node.js 
 */  


// Hi! This is a simple note keeper app. Thanks for watching. 
// git repositories at github.com/ilmuratore/note-keeper-javascript
// leave like and a comment, and subscribe to the channel !


const fs = require('fs');
const readline = require('readline-sync');
const crypto = require('crypto');

const FILE_NAME = 'notes.json';
const USERS_FILE_NAME = 'users.json';
const ENCRYPTION_KEY = Buffer.from('23935b0e2be0c14ae81d648869d5afc6177b3be993ea3d889d33c5f1ba46d2a5', 'hex');
const IV_LENGTH = 16;
const CATEGORIES = ['Work', 'Personal', 'Study', 'Other'];

let nextNoteId = 1;
let nextUserId = 1;

const encrypt = (text) => {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8' , 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return iv.toString('hex') + ':' + encrypted + ':' + authTag;
};

const decrypt = (text) => {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.shift(), 'hex');
    const authTag = Buffer.from(textParts.shift(), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, 'hex' , 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted.toString();
};

const loadNotes = () => {
    if (fs.existsSync(FILE_NAME)) {
     const data = fs.readFileSync(FILE_NAME, 'utf8');
     const notes = JSON.parse(data);
     nextNoteId = Math.max(...notes.map(note => note.id)) + 1; 
     return notes;
    }
    return []; 
};

const saveNotes = (notes) => {
    const data = JSON.stringify(notes, null, 2);
    fs.writeFileSync(FILE_NAME, data, 'utf8');
};

const registerUser = () => {
    console.log('## Register ##');
    const username = readline.question('Enter new Username: ');
    const password = readline.question('Enter new Password: ');

    const users = loadUsers();
    const id = nextUserId++;
    users.push({ id, username, password: encrypt(password)});
    saveUsers(users);
    console.log('## Registration successfull! ##');
};

const saveUsers = (users) => {
    const data = JSON.stringify(users, null, 2);
    fs.writeFileSync(USERS_FILE_NAME, data, 'utf8');
};

const loginUser = () => {
    console.log('## Login ##')
    const username = readline.question('Enter username: ');
    const password = readline.question('Enter password: ' , { hideEchoBack: true});

    const users = loadUsers();
    const user = users.find(user => user.username === username && decrypt(user.password) === password);
    if (user) {
        console.log(' ## Login successful! ## ')
        return user;
    } else {
        console.log('## Invalid username or password ##');
        return null;
    }    
};

const loadUsers = () => {
    if (fs.existsSync(USERS_FILE_NAME)) {
        const data = fs.readFileSync(USERS_FILE_NAME, 'utf8');
        const users = JSON.parse(data);
        nextUserId = Math.max(...users.map(user => user.id)) + 1;
        return users;   
    }
    return [];
};

const addNote = () => {
    console.log('## Add Note ##');
    const title = readline.question('Enter note title: ');
    const body = readline.question('Enter note body: ');
    console.log('Select a category: ');
    CATEGORIES.forEach((category, index) => {
        console.log(`${index + 1}. ${category}`);
    });
    const categoryIndex = readline.question('Choose a category numer: ') - 1;
    const category = CATEGORIES[categoryIndex];
    const notes = loadNotes();
    const id = nextNoteId++;
    notes.push({id, title, body: encrypt(body), category});
    saveNotes(notes);
    console.log(' ## Note added !##');
}; 

const listNotes = () => {
    console.log('## Your Notes ##');
    const notes = loadNotes();
    notes.forEach((note, index) => {
        console.log(`---------------------\n${index + 1}. ${note.title} [Category: ${note.category}]\n-----------------`);
    });
};

const readNoteById = () => {
    console.log('## Read Note by ID ##');
    const id = readline.questionInt('Enter note ID to read: ');
    const notes = loadNotes();
    const note = notes.find(note => note.id === id);
    if (note) {
        console.log(`--------------------\nID: ${note.id}\nTitle: ${note.title}\nBody: ${decrypt(note.body)}\nCategory: ${note.category}\n---------------------`);
    } else {
        console.log('## Note not found ##');
    }
}; 

const removeNoteById = () => {
    console.log('## Remove Note by ID ##');
    const id = readline.questionInt('Enter note ID to remove: ');
    let notes = loadNotes();
    const initialLength = notes.length;
    notes = notes.filter(note => note.id !== id);
    if (notes.length < initialLength) {
        saveNotes(notes);
        console.log('## Note removed ##')
    } else {
        console.log('## Note not found ##');
    }
};

const editNoteById = () => {
    console.log('## Edit Note by ID ##');
    const id = readline.questionInt('Enter the ID of the note to edit: ');
    const notes = loadNotes();
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex !== -1) {
        const newTitle = readline.question('Enter new title (leave blank to keep current): ');
        const newBody = readline.question('Enter new body (leave blank to keep current): ');
        console.log('Select a new category (leave blank to keep current): ');
        CATEGORIES.forEach((category, index) => {
            console.log(`${index + 1}. ${category}`);
        });
        const categoryIndex = readline.questionInt('Choose a category number: ') - 1;

        if (newTitle) {
            notes[noteIndex].title = newTitle;
        }
        if (newBody) {
            notes[noteIndex].body = encrypt(newBody);
        }
        if (categoryIndex >= 0 && categoryIndex < CATEGORIES.length) {
            notes[noteIndex].category = CATEGORIES[categoryIndex];
        }
        saveNotes(notes);
        console.log('## Note updated ##');
    } else {
        console.log('## Note not found ##');
    }
};

const searchNotes = () => {
    console.log(' ## Search Notes ##');
    const keyword = readline.question('Enter keyword to search: ');
    const notes = loadNotes();
    const filteredNotes = notes.filter(note =>
        note.title.includes(keyword) || decrypt(note.body).includes(keyword)
    );
    if (filteredNotes.legth > 0 ) {
        console.log('## Found notes ## ');
        filteredNotes.forEach((note, index) => {
            console.log(`------------\n${index + 1}. ${note.title} [Category: ${note.category}]\n------------------------`);
        });
    } else {
        console.log('## Note not found ## ');
    }
};

const listNotesByCategory = () => {
    console.log('## List Notes by Category ##');
    console.log('Select a Category to filter by: ');
    CATEGORIES.forEach((category, index) => {
        console.log(`${index + 1}. ${category}`);
    });
    const categoryIndex = readline.questionInt('Choose a category number: ') - 1;
    const category = CATEGORIES[categoryIndex];
    const notes = loadNotes();
    const filteredNotes = notes.filter(note => note.category === category);
    if (filteredNotes.length > 0 ) {
        console.log(` ## Notes in category ${category} ## `);
        filteredNotes.forEach((note, index) => {
            console.log(`-------------\n${index + 1 }. ${note.title}\n ------------`);
        });
    } else {
        console.log('## No notes found in this category ## ');
    }
};

const mainMenu = (user) => {
    console.log(`## Welcome, ${user.username}!##`);
    console.log('1. Add Note');
    console.log('2. List Notes');
    console.log('3. Read Note');
    console.log('4. Remove Note');
    console.log('5. Edit Note');
    console.log('6. Search Notes');
    console.log('7. List Notes by Category');
    console.log('8. Logout');

    const choice = readline.questionInt('Choose an option: ');
    
    switch (choice) {
        case 1:
            addNote();
            break;
        case 2:
            listNotes();
            break;
        case 3:
            readNoteById();
            break;
        case 4:
            removeNoteById();
            break;
        case 5:
            editNoteById();
            break;
        case 6:
            searchNotes();
            break;
        case 7:
            listNotesByCategory();
            break;
        case 8:
            console.log(' ## Logged out ##');
            main();
            break;
        default:
            console.log('## Invalid option ## ');
            break;
    }

    mainMenu(user);
};

const main = () => {
    console.log('## Note Keeper V3');
    console.log('1. Login');
    console.log('2. Register');
    console.log('3. Exit');

    const choice = readline.questionInt('Choose an option:');

    let currentUser = null;

    switch (choice) {
        case 1:
            currentUser = loginUser();
            if(currentUser) {
                mainMenu(currentUser);
            }
            break;
        case 2:
            registerUser();
            break;
        case 3: 
            console.log('## Goodbye! ## ');
            process.exit();
            break;
        default:
            console.log('## Invalid Option ## ')
            break;
    }

    main();
}; 

main();





