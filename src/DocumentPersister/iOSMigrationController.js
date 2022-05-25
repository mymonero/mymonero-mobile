import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import symmetric_string_cryptor from '../symmetric_cryptor/symmetric_string_cryptor'
import persistable_object_utils from "./persistable_object_utils"
// KB: I opted for static methods since I don't want to instantialize yet another bloaty controller and attach it to context

class iOSMigrationController {
    /**
     * Create an instance of this controller
     * @constructor
     * @param {object} context  - Instance of MyMonero's context object
     */
    constructor(context, debug = false) {
        
        this.context = context;
        // The debug data is handy for testing in browser rather than in a simulated device
        // this.debugData mimics the data returned by this.getFileData
        this.debugData = {
            "PasswordMeta__FF4696EB-481B-43AA-BB78-FB9D2B6A0ABC.mmdbdoc_v1": {"passwordType":"PIN","messageAsEncryptedDataForUnlockChallenge_base64String":"AwFoc208pB4+GNvW6LyClf1nT3lsmsXLsF56VEVgvsjgbBkp8WG+brVtIxmZs7L9B6k5VN+34nvnHG2hKJjxt7uIXh4Uyx2NqaC7DKx7DCTxAH6GtCSfQV\/JBQVeWguuC0kCxKV+qSOhL0py0H2cgasPOV9J+GcPZWG3e01hRU1VUga6UsEeD0PsBjyYmHhmbifiOEZTo9abOp33zKMKzsdT5sFp5c8Ib1qaE\/f1M90Gw+8ue+CCS95dq2cyRbyK+Is=","_id":"FF4696EB-481B-43AA-BB78-FB9D2B6A0ABC"},
            "Contacts__ACA90CE8-AF6F-46FD-BC7E-F5F16424D929.mmdbdoc_v1": "AwFqaLt5tLbTmuFEZ8DgpisdxDvkFoAgAtJsHemZUAGEOu4OHCFijaCCbBB6kI/z1B/C0X3p75mGuEFNf825P2xC7n7oTOHNKs4BCEC0JBcc7RhKGvFBsbJmz5hzd/l/fQwB45W8Yh4xJDcm2DbhZWggx5Pn/qyYDL48eupZeeYC6jACsW0Zq+GUGORX4YNpnRpexDMnX+uWaX/0OTD10/FzG0F5cvaL3vRL6ksWFGghQqfq9fWMwUw/stnqsWkFhVVdLPG5bywZnfdnz/gVsdVfiXdVbKrY5VwPXPUEp1Kz8+TyYhfaEulwFkZvx36n5zsC4rlgnUPc1YEnujuDTMG94nGUvrkKz/bhUe7t+btUBI6dCJQTkPl+B3vgk5pj0Ome6kE041q4j2UMCag05a7TnNnmTpoUPbP5rQm6rkAWLw==",
            "FundsRequests__859BE236-6096-4E64-B3E3-E27B56F94837.mmdbdoc_v1": "AwFOAXDp59sOhhdW7kw+IGgb3YCY76mTKNh/meN5GjDApXEJ3Vx/0DJclGprBqNr8uUUp7jZwJdav3dmlWezdUIHGzNUXCs9+qEG6yYUheIdvB+IB3k4VFlNYjDh5148/wN2voBrRJiuCPn/5zDXrenyNarWnt2sbFZkHvxMR0YWKqP5mGXxt1e+ZnSINeXm9p6C/hm3JycPwtPNQxZIQcHc8SCsxr8u3DEK2O4dnAhNLzSRHLxzNSuzwekzGzCp7BYy6mINKVPnaPorwm8BR7rEAX3fBKwPQ9zxMifUCt0ViLv4HQ+z8tur9/d8ZVPyxDyqnTT/pVyM+2hjo/G8Upl0yE05B3ENV5BHhvmFHByY1O2em85wpV3dTWaQPe9Z83mR+05ZjcEJVceWuDMdvDOW",
            "Wallets__8D662269-DE5A-491C-BC69-3DE43E23805C.mmdbdoc_v1": "AwHVuFxnFJJipUfyAdjAhsRCzUVAK47nwi6LtdCDhb64fHi3wCULl8BsRt1vF2eB7qivEUfMlyrC3NqeMjPF010ZgkAnXNyGrM9KY5hBfSHDaQikc+2gSmzSvz58u6io7DaVhbgDMzIwFKTxE+CjtMsJxjX1xrs1cjaEZPsL9ihE11TdOichwTlQjI1BobzUdQCKa5G8PtXVzPEr0UsR1n9Tjz3t3KLVV1kxf3/R4/4RfO56pOY0fxAdRqVPJBYuDKJTxuE39A+eNJnxk+YL2WrF5VMEQJXNl+vr8/8f7TZ+JJv1vB1eu3YK0VLEOohZtzZffRVjrVvnP87+Q27lyvon8RbMANfz4XwiZy86i/K6KiikJhGIvYE9qp6K9mxNXnaQdm/C66eyfjDdxFlUevOWJAnqnLgTz9TNs/kgAV4//9NS1LmIDUiU5Re1g+nL926cpwYtisdawz8UnVndq2+uw0XmoTFZecEQlaOAta8XTgoxAjh7JGi0R/slu8anCzLE3D5c8ee7TZG0MWDpvq4tlRTJyv38Sons3e68ILDTYvgzjXHWhQU0fxrciBn8+H2wQI+oxrGQOSKnyujHwtlNUXz66VcjDN0xV7g7kbt1FBuZKiriexbIh7yE+MQcl+G8GOB/B03qnqweNWY/V4L0FBagfxbj11zOAveS6T0Fks5PieSAkkdcY3tzxMvZvJixd+1Ot/MjSMGXGSabU4wgjsxKY4jYyud8Nhn7TEMGAximtHPhaRypwn3KNSE0eOL6ECxrBYbsIDYDVOvaPyD5aB4dTs8Y5+mAu0IxmKO3eegybLGQDsVfbTn6rF15DY2CDgQWxJ63LICwlwmCL0aBvMUVT9ozOIAbNJ+VEg+w8KMHjvcHDX506ushZyZSu0fNDZ9FZap+n5GO6sUSUJzyttp+Rx/Htg5U7W9BMI1Kj7NR6Km2qaU328NyUdd0JvN5VMMipVuE+qsaUf1ORnGsBTrYcZmj7k8n+rAfjOTsrdyCGAEN/DWUV9Q2K5vcq0Od0cDqShwBNXkgrKuXWVG1bI6KH7jT2HO523NIHaKDmhEsAt5oyIek1wScGW2Xow0UA4w4Qmo7xvlLBLOwZLyIabITTNy8z3gTp5Nt/v7sEYv/SPVwoqp91VHTh9deOmdw4PJH2F81aip9v/NL1o1jq/w1Z5QF3h24Sh9O2QoAYp5RpEFmZF1yapPOI2nXRI33toItqg6CyhW+sEH8SN9/+wNRyIJnXTKT5Tk5Qs5P59ylu1GgHiGCQb0SVYORN9wV6BBCevPbSUrb/h6pTSBz/C4xBb/0zBmfwRO/7QPeQJ3acrVfL54r2gp97/4b0QYgAOuraei/7ncnmjmE8pnsxk1HpAjRfQaHa2gmuvG1iZcwPpCAikxcm72ha+6wUOObV/a+mnQMCPBX+DbZVKtf0uON78WhxjK4+H0j+kBaDmgtFI3CkVgt/uumPFSGR784shxXZnQpanqRW8dyNPg63B5wO7FpB3oH35wT3pPZmbXGpqscEJ7cH3jypbFJyq6AImF73osvso9+keNMZnGOvjWdI49K3p5OUGylWL6uPfTKovtKIHvCCjlVrBzqARAFMaCMASI5S0wD/vbZzt5P8a7eGNBU2ei+qPbPqPfUIB2ejhLmRXUIGQjjtd9qKxJWB4TNJu6xcbeniFCrquuIswCAPIa1WjFdKX48WiRo9mt19IbNOWXMToaPYIIwbfk="      
        }
        // this.migrationFileData = {}
        
        if (debug) {
            this.debug = true;
            this.fileList = [
                "PasswordMeta__FF4696EB-481B-43AA-BB78-FB9D2B6A0ABC.mmdbdoc_v1",
                "Contacts__ACA90CE8-AF6F-46FD-BC7E-F5F16424D929.mmdbdoc_v1",
                "FundsRequests__859BE236-6096-4E64-B3E3-E27B56F94837.mmdbdoc_v1",
                "Wallets__8D662269-DE5A-491C-BC69-3DE43E23805C.mmdbdoc_v1",
            ]
        }
        
        this.setupFiles()
        this.migrationFilesExist = null; // initialise so that this is public

        //this.getMigrationFiles()
        this.justMigratedSuccessfully = false;
        this.performMigration = this.performMigration
        this.touchFile = this.touchFile
        this.hasPreviouslyMigrated = this.hasPreviouslyMigrated;
        this.didPreviouslyMigrate = ""
        this.hasMigratableFiles = this.hasMigratableFiles;    
    }

    async setupFiles() {
        let migrationFiles = await this.getMigrationFiles();
        if (migrationFiles !== false) {
            let migrationFileData = await this.getFileData(migrationFiles);
            this.migrationFileData = migrationFileData;
            if (migrationFileData === false) {
                this.migrationFilesExist = false;
            } else {
                this.migrationFilesExist = true;
            }
        }
        // if web do polyfill
        // if (this.context.deviceInfo.platform === 'web') {
        //     this.migrationFileData = this.debugData
        // } else {
        //     this.migrationFileData = migrationFileData
        // }
        // return
    }

    /**
    * Get debug data (mainly used for testing on web)
    * 
    * @desc - Write down a description for your function
    * @param - N/A
    * @returns - An object that mimics the key-value pairs getMigrationFiles() returns 
    * @throws - N/A
    */
    getDebugData() {
        //// console.log("Returning debug data");
        return this.debugData
    }
    
    // 
    /**
    * Main function for inserting data into Capacitor's secure storage
    * Takes the user's password, and a fileData object. Invoked once per object when password is entered correctly
    * 
    * @desc - Write down a description for your function
    * @param - {String}     password    A user-entered password that can decrypt the data in fileData
    * @param - {Object}     fileData    
    * @returns - A string indicating the outcome of inserting 
    * @throws - {Error}     err - standard JS error
    */
    migrateDataObject(password, fileData) {
        const self = this;
        var persister = self.context.persister;
        return new Promise((resolve, reject) => {
            try {
                // For the purpose of importation, we should exclude any files that are not decryptable
                if (fileData.name == "PutYourOldMyMoneroDataInHere.txt" || fileData.name.indexOf("PasswordMeta") !== -1) {
                    resolve("Non-decryptable");
                }
                let stringToDecrypt = fileData.data;
                let dataToDecrypt = fileData.data;
                if (typeof(dataToDecrypt) !== "string") {
                    stringToDecrypt = dataToDecrypt.data
                }

                symmetric_string_cryptor.New_DecryptedString__Async(stringToDecrypt, password, (err, decryptedMessage) => {
                    if (err) {
                        console.error(err)
                        reject(err)
                    }
                    let collectionName = fileData.name.substr(0, fileData.name.indexOf("__")); // Get the type of collection
                    let idOffset = fileData.name.indexOf('__') // Determine 
                    idOffset--;
                    
                    let idString = fileData.name.substr(collectionName.length + 2) // derive the ID only
                    idString = idString.substr(0, idString.indexOf(".")) // Remove the file extension
                    
                    let plaintextDocument = JSON.parse(decryptedMessage); // Parse decrypted message into JSON
                    
                    /**
                     * Once the write is returned, writeCallback is invoked
                     */
                    let writeCallback = function(err) {
                        if (err) {
                            reject(err)
                        } else {
                            resolve("Success")
                        }                        
                    }
                    // migrateFromIOS is optional in other classes, and set to false by default. It's used by wallet persistence to know when to modify variable names
                    let migrateFromIOS = true; // This is required in order for persistence to be leveraged, 
                    let testObj = JSON.parse(decryptedMessage); // persistable object utils requires a different "test" object for... legacy reasons...?
                    persistable_object_utils.write(persister, testObj, collectionName, plaintextDocument, password, writeCallback, migrateFromIOS)

                    
                })       
            } catch (err) {
                console.error(err);
                reject(err);
            }
        })
    }

    /**
    * A utility function that determines if the files we're attempting to migrate are decryptable and valid JSON
    * 
    * @desc -   A utility function that manages the migration process. 
    *           It determines if the files we're attempting to migrate are decryptable and valid JSON, then saves them
    * @param - {String}     password    A user-entered password that can decrypt the data in fileData
    * @returns - {Promise}  true if all files are safe 
    * @throws - {Error}     err - standard JS error
    */
    async performMigration(password) {
        return new Promise((resolve, reject) => {
            if (this.hasPreviouslyMigrated !== true) {
                try {
                        let safeToMigrate = this.validateFileData(password).then(safeToMigrate => {
                            if (safeToMigrate === true) {
                                try {
                                    this.migrateAllData(password)
                                    resolve(true);
                                } catch (e) {
                                    reject(e);
                                }
                            }
                        });
                    } catch (error) {
                        reject(error);
                    }    
            } else {
                let error = "Previously migrated";
                reject(error)
             
            }   
        })
    }    

    /**
    * A utility function that determines if the file we're attempting to migrate is decryptable and is valid JSON
    * 
    * @desc - Write down a description for your function
    * @param - {String}     password    A user-entered password that can decrypt the data in fileData
    * @returns - {Promise}  true if all files are safe 
    * @throws - {Error}     err - standard JS error
    */
    isValidJSONFile(password, fileObj) {
        return new Promise((resolve, reject) => {
            if (fileObj.name.indexOf("PasswordMeta") >= 0 || fileObj.name.indexOf("Settings") >= 0) {
                resolve(true);
            }
            symmetric_string_cryptor.New_DecryptedString__Async(fileObj.data, password, (err, decryptedMessage) => {
                if (err) {
                    console.error(err)
                    reject(err)
                }
                
                try {
                    let jsonObj = JSON.parse(decryptedMessage);
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            })
        })
    }

    /**
    * Validate all files in this.migrationFileData
    * 
    * @desc - Write down a description for your function
    * @param - {String}     password    A user-entered password that can decrypt the data in fileData
    * @returns - {Promise}  true if all files are safe 
    * @throws - {Error}     err - standard JS error
    */
    validateFileData(password) {
        return new Promise((resolve, reject) => {
            // console.log("validate file data invoked with password:" + password);
            var isValidPromiseArr = [];
            var i;
            if (this.debug == true) {
                // for web
                for (let fileName in this.migrationFileData) {
                  let fileObj = {
                    name: fileName,
                    data: this.migrationFileData[fileName]
                  }
                //   // console.log("Validate loop:");
                  isValidPromiseArr.push(this.isValidJSONFile(password, fileObj))
                  //i++;
                }

            } else {
                // for ios
                for (let fileName in this.migrationFileData) {
                    let fileObj = {
                      name: fileName,
                      data: this.migrationFileData[fileName].data
                    }
                    // console.log("Validate loop:");
                    isValidPromiseArr.push(this.isValidJSONFile(password, fileObj))
                    //i++;
                  }
            }

            Promise.all(isValidPromiseArr).then((values) => {
                resolve(true);
              }).catch(error => {
                  reject(error);
              });
        })
    }
    
    /**
    * We don't really rename files, we attempt a copy before deleting the original if copy succeeds
    * !!! Not confirmed working
    * @desc - Write down a description for your function
    * @param - {String}     password    A user-entered password that can decrypt the data in fileData
    * @returns - {Promise}  true if all files are safe 
    * @throws - {Error}     err - standard JS error
    */
   renameFile(fileObj) {
        return new Promise((resolve, reject) => {            
            const newName = `${fileObj.name}.old`
            try {
                const copy = async () => {
                    await Filesystem.copyFile({
                        from: fileObj.name,
                        to: newName,
                        directory: Directory.Documents,
                        toDirectory: Directory.Documents
                    }).then(async () => {
                        await Filesystem.deleteFile({
                            path: fileObj.name,
                            directory: Directory.Documents
                        })
                    })
                }
                resolve(true)
            } catch (error) {
                console.error(error);
                reject(error)
            }
                        
            Promise.all(isValidPromiseArr).then((values) => {
                    resolve(true);
                }).catch(error => {
                    reject(error);
                });

            })
    }

    
    /**
    * Rename all files in this.migrationFileData
    * !!! Not confirmed working
    * @desc - Write down a description for your function
    * @param - {String}     password    A user-entered password that can decrypt the data in fileData
    * @returns - {Promise}  true if all files are safe 
    * @throws - {Error}     err - standard JS error
    */
    renameAllMigratedFiles() {
        return new Promise((resolve, reject) => {
            // console.log("renaming file data");
            var renamePromiseArr = [];
            var i;
            for (let fileName in this.migrationFileData) {
            let fileObj = {
                name: fileName,
                data: this.migrationFileData[fileName]
            }
            renamePromiseArr.push(this.renameFile(fileObj))
            //i++;
            Promise.all(isValidPromiseArr).then((values) => {
                    resolve(true);
                }).catch(error => {
                    reject(error);
                });

            }
        })
    }

    /**
    * TODO: Get this working properly
    * @desc - Determine if we have previously migrated, to safeguard against future attempts.
    * @returns - {Promise}  true if previous migration has occurred, false otherwise
    * @throws - {Error}     err - standard JS error
    */
    async hasPreviouslyMigrated() {
        const self = this
        return new Promise((resolve, reject) => {
            function migrationCheckCallback(err, result) {
            
                
                if (result.length > 0) {
                    self.didPreviouslyMigrate = true;
                    resolve(true);
                }
                self.didPreviouslyMigrate = false;
                resolve(false);
            }
    
            let migrationPreviouslyPerformed = this.context.persister.IdsOfAllDocuments("migratedOldIOSApp", migrationCheckCallback)
        })
    }

    async hasMigratableFiles() {
         const self = this
        if (this.debug) {
            return true;
        }
        let hasMigratableFiles = await this.getMigrationFiles();
        if (hasMigratableFiles === false) {
            self.doesHaveMigratableFiles = false;
            return false;
        }
        self.doesHaveMigratableFiles = true;
        return true
    }

    /**
    * TODO: Currently, the reload happens in order to allow us to ensure user data is "hydrated" correctly
    * Rather than reload the app, it would be better if we could initialise all the wallets, contacts, etc
    * @desc - Save a flag denoting that we have previously migrated.
    * @returns - {Promise}  true if previous migration has occurred, false otherwise
    * @throws - {Error}     err - standard JS error
    */
    async setMigratedSuccessfully() {
        this.justMigratedSuccessfully = true;
        //// console.log(`setMigratedSuccessfully invoked`)
        this.context.persister.InsertDocument("migratedOldIOSApp", "migratedOldIOSApp", "Great success!", () => {
            // console.log("Aaaaaaand we're done");
            //alert("MyMonero has imported your existing information");
        })
    }

    /**
    * Used to create a promise array comprised of each file being passed as a parameter to this.migrateDataObject
    * 
    * @desc - invokes migrateDataObject on every file
    * @returns - {Promise} 
    * @throws - {Error}     err - standard JS error
    */
    migrateAllData(password) {
        const self = this;
        return new Promise((resolve, reject) => {
            var migrationPromiseArr = [];
            var i;
            for (let fileName in this.migrationFileData) {
                if (fileName.indexOf("PasswordMeta") !== -1 || fileName.indexOf("Settings") !== -1) {
                    // we don't want to migrate passwordmeta or settings
                } else {
                    // console.log(`building migAllDataObjForPromise`);
                    let fileObj = {
                        name: fileName,
                        data: this.migrationFileData[fileName]
                    }
                    migrationPromiseArr.push(this.migrateDataObject(password, fileObj))
                }
            }
    
            Promise.all(migrationPromiseArr).then((values) => {
                // console.log("migalldata ran successfully");
                let result = self.setMigratedSuccessfully();
                resolve(true)
            }).catch(error => {
                // console.log("migalldata failed");
                reject(error)
            });
            //resolve("finishedmigrating");
        })
    }

    /**
    * Used during debug to create a file that can be grepped - so we can isolate the container we need to copy old files into
    * 
    * @desc - writes a file to iOS app folder
    * @returns - {void} 
    * @throws - {Error}     err - standard JS error
    */
    async touchFile() {
        const writeSecretFile = async () => {
            // console.log("Writing Touchfile")
            await Filesystem.writeFile({
              path: 'PutYourOldMyMoneroDataInHere.txt',
              data: "We migrate data in this folder to our new app",
              directory: Directory.Documents,
              encoding: Encoding.UTF8,
            });
        };
        let write = writeSecretFile();
    }

    /**
    * @desc - Getter for {migrationFilesExist}
    * @returns - {Object}  An array of all valid decryptable files
    * @throws - {Error}     err - standard JS error
    */
    get _migrationFilesExist() {
        return this.migrationFilesExist
    }

    /**
    * @desc - Setter for {migrationFilesExist}
    * @param - {Boolean} - whether migration files exist or not
    * @throws - {Error}     err - standard JS error
    */
    set _migrationFileData(bool) {
        this.migrationFilesExist = bool;
    }

    /**
    * @desc - Getter for {migrationFileData}
    * @returns - {Object}  An array of all valid decryptable files
    * @throws - {Error}     err - standard JS error
    */
    get _migrationFileList() {
        return this.migrationFileList
    }

    /**
    * @desc - Setter for {migrationFileData}
    * @throws - {Error}     err - standard JS error
    */
    set _migrationFileList(fileArray) {
        this.migrationFileList = fileArray;
    }

    /**
    * @desc - Getter for {migrationFileData}
    * @returns - {Object}  An array of all valid decryptable files
    * @throws - {Error}     err - standard JS error
    */
    get _migrationFileData() {
        return this.migrationFileData
    }

    /**
    * @desc - Setter for {migrationFileData}
    * @throws - {Error}     err - standard JS error
    */
    set _migrationFileData(fileData) {
        this.migrationFileData = fileData;
    }
    /**
    * @desc - Retrieve all files with the extension "mmdbdoc_v1".
    * @returns - {Array}  An array of all valid decryptable files, or Boolean false if no files found
    * @throws - {Error}     err - standard JS error
    */
    async getMigrationFiles() {
        //// console.log("Get migration files");
        if (this.debug) {
            console.warn("Currently in debug mode")
            let fileList = [
                "PasswordMeta__FF4696EB-481B-43AA-BB78-FB9D2B6A0ABC.mmdbdoc_v1",
                "Contacts__ACA90CE8-AF6F-46FD-BC7E-F5F16424D929.mmdbdoc_v1",
                "FundsRequests__859BE236-6096-4E64-B3E3-E27B56F94837.mmdbdoc_v1",
                "Wallets__8D662269-DE5A-491C-BC69-3DE43E23805C.mmdbdoc_v1",
            ]
            this.fileList = fileList;
            return fileList
            //return this.getDebugData()
        } else {
            // console.log("Running in production mode")
        }
        //// console.log("Dir parsing started");
        // Files without mmdbdoc_v1 are automatically excluded
        let readDirOptions = { path: "", directory: Directory.Documents }
        let fileList = await Filesystem.readdir(readDirOptions);
        let mmdbdocsPresent = false;
        let legacyFiles = [];

        try {
            for (let i = 0; i < fileList.files.length; i++) {
                if (fileList.files[i].indexOf('mmdbdoc_v1') !== -1) {
                    if (fileList.files[i].indexOf("PasswordMeta") == -1 && fileList.files[i].indexOf("Settings") == -1) {
                        // console.log("Not password and not settings")
                        mmdbdocsPresent = true;
                        legacyFiles.push(fileList.files[i]);
                    }
                }
            }
        } catch (error) {
            // console.log("fileListCatch");
            console.error(error);
            throw error;
        }

        if (mmdbdocsPresent) {
            // console.log("dir parsing returned with results");
            // console.log(legacyFiles);
            this.migrationFileList = legacyFiles;
            return legacyFiles;
        }
        //// console.log("dir parsing returned false");
        return false;
        // return mmdbdocsPresent;
    }

    // Reads the contents of each file in the file array, and returns an object containing fileData objects
    async getFileData(fileArray) {
        if (this.debug) {
            return this.debugData;
        }
        let fileData = {};
        fileArray.forEach(async (value, index) => {
            let options = {
                path: value,
                directory: Directory.Documents,
                encoding: Encoding.ASCII,
            }
            let data = await Filesystem.readFile(options)            
            fileData[value] = data;
        })
        return fileData;
    }

    // TODO: get proper settings data 
    static async getOldSettingsData() {
        let data = {"_id":"F5616E0A-AC75-49D8-BD84-DC6CFE36CF81","passwordType":"PIN","messageAsEncryptedDataForUnlockChallenge_base64String":"AwGbf1OmYmbaXqw3CLqKOTOlZ\/uMmDNvR9rj4x1poyrQ1vgQdDdz2Z3GIK1cDWJEQBd4RppS3CHn2EGOz9UoECIhSI8ysHMu3me+j8M0OIll3YJZDs+A\/rbBgDrXOgL5\/hqA7ReTeT53F6ZTEjYpZM1KwTQIRtIEH8byxI6BtXf1kQAjrHJvbHHAk3UY+wNaZM25akSftw0FDnUne4B9pN72PyWxUGfh3Ys+KUGgH4vPLG7ZP6djOC318iSyKcISwH8="}
        return data
    }
}

export default iOSMigrationController