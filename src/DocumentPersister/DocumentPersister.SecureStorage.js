
// "use strict"

import 'capacitor-secure-storage-plugin'
import { Plugins } from '@capacitor/core' // Initialises the Secure Storage Capacitor plugin
import DocumentPersister_Interface from './DocumentPersister_Interface'

const { SecureStoragePlugin } = Plugins

class DocumentPersister extends DocumentPersister_Interface {
  constructor (options) {
    super(options) // must call on super before accessing options
    //
    const self = this
    options = self.options
    //
    self.store = {}
  }

  //
  // Runtime - InMemory - Accessors
  ___lazy_writable_collectionStringsById (collectionName) {
    // console.log("SecureStorage: invoked ___lazy_writable_collectionStringsById");
    const self = this
    let collectionStringsById = self.store[collectionName] || null
    if (typeof collectionStringsById === 'undefined' || !collectionStringsById) {
      collectionStringsById = {}
      self.store[collectionName] = collectionStringsById
    }
    if (typeof collectionStringsById === 'undefined' || !collectionStringsById) {
      throw 'expected non-nil collectionStringsById'
    }
    return collectionStringsById
  }

  //
  //
  // Runtime - Accessors - Interface - Overrides
  //
  __documentContentStringsWithIds (collectionName, ids, fn) {
    // console.log("SecureStorage: invoked __documentContentStringsWithIds");
    // console.log(collectionName);
    const parameters = { collectionName, fn, ids }
    // We know what the ids are, from ids param. Build up an array of promises
    for (let i = 0; i < obj.length; i++) {
      // console.log(`Promise ${i}`);
      // console.log(obj);
      // console.log(obj[0]);
      const retrievalObj = {
        key: collectionName + obj[i]
      }
      // console.log(retrievalObj);

      promiseArr[i] = SecureStoragePlugin.get(retrievalObj).catch(error => {
        // console.log("There was a problem with promise number");
        // console.log(i);
        // console.log(error);
        // let's get keys and output them
        const keys = SecureStoragePlugin.keys().then(keys => {
          // console.log("Promise problem: keys");
          // console.log(keys);
        })
      })
    }

    Promise.all(promiseArr).then((values) => {
      // console.log("Here are the __documentContentStringsWithIds values ");
      const documentCollectionArr = []
      for (let j = 0; j < values.length; j++) {
        const returnedObj = JSON.parse(values[j].value)
        // console.log(`returnedObj for ${j}`)
        // console.log(returnedObj);
        documentCollectionArr.push(returnedObj)
      }
      // console.log(values);
      setTimeout(function () { // maintain async
        fn(null, documentCollectionArr)
      })
    }).catch(error => {
      // console.log("There was a problem retrieveing allDocument values ");
      // console.log(error);
    })

    // SecureStoragePlugin.get({ key: collectionName }).then((returnData) => {
    // 	let jsonString = returnData.value;
    // 	let obj = JSON.parse(jsonString);
    // 	//// console.log("This is what we have for " + parameters.collectionName);
    // 	//// console.log(obj);
    // 	let strings = [];

    // 	let promiseArr = [];
    // 	// since we could get multiple ids back, we need to create a number of promises and return the values of them
    // 	for (let i = 0; i < obj.length; i++) {
    // 		//// console.log(`Promise ${i}`);
    // 		//// console.log(obj);
    // 		//// console.log(obj[0]);
    // 		let retrievalObj = {
    // 			key: collectionName + obj[i]
    // 		}

    // 		//// console.log(retrievalObj);

    // 		promiseArr[i] = SecureStoragePlugin.get(retrievalObj).catch(error => {
    // 			//// console.log("There was a problem with promise number");
    // 			//// console.log(i);
    // 			//// console.log(error);
    // 			// let's get keys and output them
    // 			let keys = SecureStoragePlugin.keys().then(keys => {
    // 				//// console.log("Promise problem: keys");
    // 				//// console.log(keys);
    // 			});
    // 		})
    // 	}

    // 	Promise.all(promiseArr).then((values) => {
    // 		//// console.log("Here are the allDocument values ");
    // 		var documentCollectionArr = [];
    // 		for (let j = 0; j < values.length; j++) {
    // 			let returnedObj = JSON.parse(values[j].value);
    // 			//// console.log(`returnedObj for ${j}`)
    // 			//// console.log(returnedObj);
    // 			documentCollectionArr.push(returnedObj);
    // 		}
    // 		//// console.log(values);
    // 		setTimeout(function() { // maintain async
    // 			fn(null, documentCollectionArr)
    // 		})
    // 	}).catch(error => {
    // 		//// console.log("There was a problem retrieveing allDocument values ");
    // 		//// console.log(error);
    // 	});

    // 	//// console.log("Originally returned this: ");
    // 	// const collectionStringsById = self.store[collectionName] || {}
    // 	// const ids = Object.keys(collectionStringsById)
    // 	// const ids_length = ids.length

    // 	// for (var i = 0 ; i < ids_length ; i++) {
    // 	// 	const id = ids[i]
    // 	// 	const stringWithId = collectionStringsById[id] || null
    // 	// 	strings.push(stringWithId)
    // 	// }
    // 	// //// console.log(strings)

    // }).catch((error) => {
    // 	//// console.log(`Catch error on allDocuments for ${parameters.collectionName}`);
    // 	//// console.log(error);
    // 	let strings = [];
    // 	setTimeout(function() { // maintain async
    // 		fn(null, strings)
    // 	})
    // })
    // const self = this
    // const collectionStringsById = self.store[collectionName] || {}
    // const ids_length = ids.length
    // const stringsWithIds = []
    // for (var i = 0 ; i < ids_length ; i++) {
    // 	const id = ids[i]
    // 	const stringWithId = collectionStringsById[id] || null
    // 	if (stringWithId != null) {
    // 		stringsWithIds.push(stringWithId)
    // 	}
    // }
  }

  __idsOfAllDocuments (collectionName, fn) {
    // console.log("SecureStorage: invoked __idsOfAllDocuments");
    // console.log(collectionName);
    const parameters = { collectionName, fn }
    SecureStoragePlugin.get({ key: collectionName }).then((returnData) => {
      // console.log("__idsOfAllDocuments: This is what we have for " + parameters.collectionName);
      const jsonString = returnData.value
      // console.log(jsonString);
      // console.log(typeof(jsonString));

      const obj = JSON.parse(jsonString)
      // console.log(obj);
      // console.log(typeof(obj))

      const strings = []
      for (let i = 0; i < obj.length; i++) {
        strings.push(`${parameters.collectionName}${obj[i]}`)
        // console.log("Here's our string push: ");
        // console.log(strings);
      }
      setTimeout(function () { // maintain async
        // console.log("SecureStorage: __idsOfAllDocuments async return");
        // console.log(obj);
        fn(null, obj)
      })
    }).catch((error) => {
      // console.log(`__idsOfAllDocuments: Catch error on __idsOfAllDocuments for ${parameters.collectionName} -- this collectionName likely doesn't have records`);
      // console.log(error);
      const strings = []
      setTimeout(function () { // maintain async
        fn(null, strings)
      })
    })

    const self = this
    const collectionStringsById = self.store[collectionName] || {}
    const ids = Object.keys(collectionStringsById)
    // setTimeout(function() { // maintain async
    // 	fn(null, ids)
    // })
  }

  __allDocuments (collectionName, fn) {
    SecureStoragePlugin.keys().then(keys => {
      // console.log("Existing keys:");
      // console.log(keys);
    })
    // console.log("SecureStorage: invoked __allDocuments");
    // console.log(collectionName);
    const parameters = { collectionName, fn }
    // get collectionName object -- that's our index
    SecureStoragePlugin.get({ key: collectionName }).then((returnData) => {
      const jsonString = returnData.value
      const obj = JSON.parse(jsonString)
      // console.log("This is what we have for " + parameters.collectionName);
      // console.log(obj);
      const strings = []

      const promiseArr = []
      // since we could get multiple ids back, we need to create a number of promises and return the values of them
      for (let i = 0; i < obj.length; i++) {
        // console.log(`Promise ${i}`);
        // console.log(obj);
        // console.log(obj[0]);
        const retrievalObj = {
          key: collectionName + obj[i]
        }

        // console.log(retrievalObj);

        promiseArr[i] = SecureStoragePlugin.get(retrievalObj).catch(error => {
          // console.log("There was a problem with promise number");
          // console.log(i);
          // console.log(error);
          // let's get keys and output them
          const keys = SecureStoragePlugin.keys().then(keys => {
            // console.log("Promise problem: keys");
            // console.log(keys);
          })
        })
      }

      Promise.all(promiseArr).then((values) => {
        // console.log("Here are the allDocument values ");
        const documentCollectionArr = []
        for (let j = 0; j < values.length; j++) {
          const returnedObj = JSON.parse(values[j].value)
          // console.log(`returnedObj for ${j}`)
          // console.log(returnedObj);
          documentCollectionArr.push(returnedObj)
        }
        // console.log(values);
        setTimeout(function () { // maintain async
          fn(null, documentCollectionArr)
        })
      }).catch(error => {
        // console.log("There was a problem retrieveing allDocument values ");
        // console.log(error);
      })

      // console.log("Originally returned this: ");
      // const collectionStringsById = self.store[collectionName] || {}
      // const ids = Object.keys(collectionStringsById)
      // const ids_length = ids.length

      // for (var i = 0 ; i < ids_length ; i++) {
      // 	const id = ids[i]
      // 	const stringWithId = collectionStringsById[id] || null
      // 	strings.push(stringWithId)
      // }
      // //// console.log(strings)
    }).catch((error) => {
      // console.log(`Catch error on allDocuments for ${parameters.collectionName}`);
      // console.log(error);
      const strings = []
      setTimeout(function () { // maintain async
        fn(null, strings)
      })
    })

    // const self = this;
    // try {
    // 	let options = {
    // 		key: collectionName
    // 	}
    // 	SecureStoragePlugin.get(options).then((returnData) => {
    // 		//// console.log(`Retrieved data for ${collectionName}`);
    // 		//// console.log(returnData);
    // 		const strings = []
    // 		const returnArray = []
    // 		let dataObj = JSON.parse(returnData.value);

    // 		////// console.log(dataObj);
    // 		fn(null, returnData);
    // 		return;
    // 	}).catch(error => {
    // 		//// console.log(`No data for key ${collectionName}`);
    // 		//// console.log(error);
    // 		fn(null, []);
    // 	});
    // } catch (e) {
    // 	//// console.log("Error: Could not access SecureStorage for some reason");
    // 	//// console.log(e);
    // }
    // let rootObj = SecureStoragePlugin.get({ key: "DataStore"}).then((rootObject) => {
    // 	//// console.log("Root object looks like this:");
    // 	//// console.log(rootObject);

    // 	setTimeout(function() { // maintain async
    // 		fn(null, [])
    // 	})
    // }).catch(() => {
    // 	let strings = [];
    // 	setTimeout(function() { // maintain async
    // 		fn(null, strings)
    // 	})
    // });
  }

  _new_fileDescriptionWithComponents (collectionName, _id) {
    // console.log("SecureStorage: invoked _new_fileDescriptionWithComponents");
    // console.log(collectionName);
    // console.log(_id);
    return {
      _id: _id,
      collectionName: collectionName
    }
  }

  //
  //
  // Runtime - Imperatives - Interface - Overrides
  //
  __insertDocument (collectionName, id, documentToInsert, fn) {
    // console.log('SecureStorage: invoked __insertDocument')
    const rootObject = SecureStoragePlugin.get({ key: collectionName }).then((returnData) => {
      // console.log('This document set has an index saved')
      // console.log(returnData)

      const indexArray = JSON.parse(returnData.value)

      // Since the legacy code is horrendous, we don't know if we've been passed a string or an object
      let stringContents = ''
      if (typeof documentToInsert === 'string') {
        stringContents = documentToInsert
      } else {
        try {
          stringContents = JSON.stringify(documentToInsert)
        } catch (e) {
          fn(e)
          return
        }
        if (!stringContents || typeof stringContents === 'undefined') { // just to be careful
          fn(new Error('Unable to stringify document for write.'))
          return
        }
      }

      // Promise to update collectionName index file

      indexArray.push(id)
      const indexPromise = SecureStoragePlugin.set({ key: collectionName, value: JSON.stringify(indexArray) }).then(() => {
        // console.log('Saved successfully')
        let keys = SecureStoragePlugin.keys().then(keys => {
          // console.log("Promise output: keys");
          // console.log(keys);
        })
      })

      // Promise to create object using its id as a key

      const saveObj = {
        id: id,
        value: stringContents
      }

      const saveObjString = JSON.stringify(saveObj)

      const objectKey = collectionName + id

      const objectPromise = SecureStoragePlugin.set({ key: objectKey, value: saveObjString }).then(() => {
        // console.log("Saved successfully");
      })

      // console.log("We would create an object using this object and key");
      // console.log(indexArray);
      // console.log(saveObj)  

      objectPromise.then(values => {
        // console.log(values);
        // console.log('Index updated and object saved successfully')
        setTimeout(function () {
          fn(null, documentToInsert)
        })
      }).catch(error => {
        // console.log('There was an error saving the object')
        // console.log(error)
        setTimeout(function () {
          fn(null, documentToInsert)
        })
      })

      // this code exists for debug -- we want to hop to catch expression
      /// /// console.log("this code exists for debug -- we want to hop to catch expression");
      /// /// console.log(nonExistant);

      // if (keys.length == 0) {
      // 	let documents = [];
      // 	fn(null, documents);
      // }

      // // insert into index, then save object with appropriate ID
      // let rootObjData = returnData.value;
      // //// console.log("Root obj")
      // //// console.log(rootObjData);

      // let dataObj = {
      // 	_id: id,
      // 	data: documentToInsert
      // }
      // documents.push(dataObj);

      // let data = {
      // 	key: collectionName,
      // 	value: documents
      // }

      // //// console.log(JSON.stringify(data))

      // SecureStoragePlugin.set(data).then(() => {
      // 	//// console.log("Saved document successfully");
      // 	fn(null, documentToInsert)
      // })

      // setTimeout(function() {
      // 	fn(null, documentToInsert)
      // })
    }).catch(() => {
      // console.log("No root object, create one");
      const rootObject = {}
      rootObject[collectionName] = []
      // console.log(rootObject);
      // console.log(collectionName);
      // console.log(documentToInsert);

      // Since the legacy code is horrendous, we don't know if we've been passed a string or an object
      let stringContents = ''
      if (typeof documentToInsert === 'string') {
        stringContents = documentToInsert
      } else {
        try {
          stringContents = JSON.stringify(documentToInsert)
        } catch (e) {
          fn(e)
          return
        }
        if (!stringContents || typeof stringContents === 'undefined') { // just to be careful
          fn(new Error('Unable to stringify document for write.'))
          return
        }
      }

      // Promise to create collectionName index file

      const collectionObj = []
      collectionObj.push(id)
      // console.log("We would create an index with this obj");
      // console.log(collectionObj);
      const indexPromise = SecureStoragePlugin.set({ key: collectionName, value: JSON.stringify(collectionObj) }).then(() => {
			 	//// console.log("Saved successfully");
      })

      // Promise to create object using its id as a key

      const saveObj = {
        id: id,
        value: stringContents
      }

      const saveObjString = JSON.stringify(saveObj)

      const objectKey = collectionName + id

      const objectPromise = SecureStoragePlugin.set({ key: objectKey, value: saveObjString }).then(() => {
        // console.log("Saved successfully");
		   	})

      // console.log("We would create an object using this object and key");
      // console.log(collectionObj);
      // console.log(saveObj)

      const promises = [indexPromise, objectPromise]

      Promise.all(promises).then(values => {
        // console.log(values);
        // console.log("Object saved successfully");
        setTimeout(function () {
          fn(null, documentToInsert)
        })
      }).catch(error => {
        // console.log("There was an error saving the object");
        // console.log(error);
      })

      // rootObject[collectionName].push(saveObj);
      // //// console.log(rootObject);
      // SecureStoragePlugin.set({ key: "DataStore", value: JSON.stringify(rootObject) }).then(() =>  {
      // 	//// console.log("Saved successfully");
      // })
    })
  }

  // We keep distinct files per collection type, which have an array of ids.
  // These ids in the array then refer to a distinct object in the format of: ${collectionName}${id} -- eg Walletn2342klsx-e3kmdef-23mkdsf, Settings233ne-befed-21343, etc
  getRootObj (collectionName) {
    // console.log(`Trying to get root object for ${collectionName}`);
    const rootObject = SecureStoragePlugin.get({ key: collectionName }).then((returnData) => {
      // console.log("Root object");
      const rootObj = JSON.parse(returnData.value)
      // console.log(rootObj);
    }).catch(() => {
      // console.log("No root object exists yet");
    })
  }
  /**
 *
 * Methods
		get(options: { key: string }): Promise<{ value: string }>
		if item with specified key does not exist, throws an Error
		keys(): Promise<{ value: string[] }>
		set(options: { key: string; value: string }): Promise<{ value: boolean }>
		remove(options: { key: string }): Promise<{ value: boolean }>
		clear(): Promise<{ value: boolean }>
		set, remove and clear return true in case of success and false in case of error
		getPlatform(): Promise<{ value: string }>
		returns which implementation is used - one of 'web', 'ios' or 'android'

*/
  // Safe to write

  DocumentsWithIds (collectionName, ids, fn) {
    const err = null
    const promiseArr = []
    const parameters = { collectionName, ids, fn }

    // console.log(`SecureStorage: DocumentsWithIds for ${collectionName}`)
    // console.log(ids)
    // console.log("This is what we have for " + parameters.collectionName);

    // since we could get multiple ids back, we need to create a number of promises and return the values of them
    for (let i = 0; i < ids.length; i++) {
      // console.log(`Promise ${i}`);
      // console.log(ids);
      // console.log(ids[0]);
      const retrievalObj = {
        key: collectionName + ids[i]
      }

      // console.log(retrievalObj);

      promiseArr[i] = SecureStoragePlugin.get(retrievalObj).catch(error => {
        // console.log("There was a problem with promise number");
        // console.log(i);
        // console.log(error);
        // let's get keys and output them
        const keys = SecureStoragePlugin.keys().then(keys => {
          // console.log("Promise problem: keys");
          // console.log(keys);
        })
      })
    }

    Promise.all(promiseArr).then((values) => {
      // console.log("SecureStorage: DocumentsWithIds: Here are the returned promise values values ");
      const documentCollectionArr = []
      for (let j = 0; j < values.length; j++) {
        const returnedObj = JSON.parse(values[j].value)
        // console.log(`returnedObj for ${j}`)
        // console.log(returnedObj);
        documentCollectionArr.push(returnedObj)
      }
      // console.log(documentCollectionArr);
      // console.log(values);
      setTimeout(function () { // maintain async
        fn(null, documentCollectionArr)
      })
    }).catch(error => {
      // console.log("There was a problem retrieving allDocument values ");
      // console.log(error);
    })
  }

  __updateDocumentWithId (collectionName, id, updateString, fn) {

    const keys = SecureStoragePlugin.keys().then(keys => {
      const objectKey = collectionName + id
      /* We need to:
				1. retrieve the object
				2. JSON.parse it
				3. update the value
				4. JSON stringify it.
				5. save the new stringified object
			*/
      SecureStoragePlugin.get({ key: objectKey }).then(jsonString => {
        // 1. complete
        const obj = JSON.parse(jsonString.value)
        // 2. complete
        obj.value = updateString
        // 3. complete
        const saveObj = {
          id: id,
          value: updateString
        }

        const objectKey = collectionName + id
        const saveObjString = JSON.stringify(saveObj)
        const objectPromise = SecureStoragePlugin.set({ key: objectKey, value: saveObjString }).then(() => {
          // console.log('Saved successfully')
        })

        Promise.all([objectPromise]).then(values => {
          // console.log('Index updated and object saved successfully')
          setTimeout(function () {
            fn(null, values)
          })
        }).catch(err => {
          console.error('Object save failed')
          fn(err, null)
        })
      })
    })
  }

  async __removeDocumentsWithIds (collectionName, idsToRemove, fn) {
    // We need to remove the id from the collectionName index
    SecureStoragePlugin.get({ key: collectionName }).then((returnData) => {
      // console.log("removeDocumentsWithIds: This is what we have for " + collectionName);
      const jsonString = returnData.value
      const obj = JSON.parse(jsonString)

      for (let i = 0; i < idsToRemove.length; i++) {
        const keyToCompare = collectionName + idsToRemove[i]
        const newIndexArr = []
        for (let j = 0; j < Object.keys(obj).length; j++) {
          // Comparing ${obj[j]} to ${idsToRemove[i]}
          if (obj[j] !== idsToRemove[i]) {
            newIndexArr.push(obj[j])
          }
        }

        const key = collectionName + idsToRemove[i]
        const data = {
          key: key
        }
        if (newIndexArr.length == 0) {
          // No more of this collection left
          if (collectionName == 'Wallets') {
            // Delete all files since we have no more wallets, and don't want to be made to use the old password when a new wallet is added
            // We delete everything here, since we won't be able to decrypt old data using a new PIN unless it is exactly the same as the old one
            this.__removeAllData() // Cleared everything due to no wallets being left
          } else {
            // Removed collection ${collectionName}
            // console.log(`Removed collection ${collectionName}`);
            SecureStoragePlugin.remove({ key: collectionName }).then(() => {
              // finished removing collection
            })
          }
        } else {
          // console.log("Update the non-empty index");
          // console.log("Update index to this:");

          SecureStoragePlugin.set({ key: collectionName, value: JSON.stringify(newIndexArr) }).then(() => {
            // console.log("Updated index successfully");
            // fn(null, obj)
            // setTimeout(function() { // maintain async
            // 	//// console.log("SecureStorage: __removeDocumentsWithIds async return");
            // 	//// console.log(obj);
            // 	fn(null, obj)
            // })
          })
          // console.log("Length:");
          // console.log(newIndexArr.length)
        }
        promiseArr[i] = SecureStoragePlugin.remove(data).catch(error => {
          // console.log("There was a problem with promise number");
          // console.log(i);
          // console.log(error);
          // let's get keys and output them
          const keys = SecureStoragePlugin.keys().then(keys => {
            // console.log("Promise problem: keys");
            // console.log(keys);
          })
        })
      }
    }).catch((error) => {
      // console.log(`__idsOfAllDocuments: Catch error on __removeDocumentsWithIds for ${collectionName} -- this collectionName likely doesn't have records`);
      // console.log(error);
      const strings = []
      setTimeout(function () { // maintain async
        fn(null, strings)
      })
    })
    // console.log("SecureStorage: invoked __removeDocumentsWithIds");
    // console.log(idsToRemove);
    // console.log(collectionName);

    var promiseArr = []
    for (let i = 0; i < idsToRemove.length; i++) {
      const key = collectionName + idsToRemove[i]
      const data = {
        key: key
      }
      promiseArr[i] = SecureStoragePlugin.remove(data).catch(error => {
        // console.log("There was a problem with promise number");
        // console.log(i);
        // console.log(error);
        // let's get keys and output them
        const keys = SecureStoragePlugin.keys().then(keys => {
          // console.log("Promise problem: keys");
          // console.log(keys);
        })
      })
    }

    Promise.all(promiseArr).then((values) => {
      // console.log("Here we have removed ids. Check for any remaining wallets, and if not, delete all data");
      const documentCollectionArr = []
      const keys = SecureStoragePlugin.keys().then(keys => {
        // console.log("All set keys");
        // console.log(keys);
      })
      // console.log(values);
      setTimeout(function () { // maintain async
        const numRemoved = promiseArr.length
        fn(null, documentCollectionArr)
      })
    }).catch(error => {
      // console.log("There was a problem deelting the data");
      // console.log(error);
    })

    // setTimeout(function() {
    // 	let keys = SecureStoragePlugin.keys().then(keys => {
    // 		//// console.log("All set keys");
    // 		//// console.log(keys);
    // 	});
    // 	fn(null, numRemoved)
    // })
    // //// console.log("SecureStorage: invoked __removeDocumentsWithIds");
    // //// console.log(idsToRemove);
    // const self = this
    // const collectionStringsById = self.store[collectionName] || {}
    // var numRemoved = 0
    // //// console.log(self.store);
    // const idsToRemove_length = idsToRemove.length
    // for (var i = 0 ; i < idsToRemove_length ; i++) {
    // 	const id = idsToRemove[i]
    // 	const valueExistsAtId = (collectionStringsById[id] || null) != null
    // 	if (valueExistsAtId) {
    // 		delete self.store[collectionName][id]
    // 		numRemoved += 1
    // 	}
    // }
    // setTimeout(function() {
    // 	fn(null, numRemoved)
    // })
  }

  __deleteIndex (collectionName, fn) {
    SecureStoragePlugin.remove({ key: collectionName }).then(() => {
      // console.log(`Removed collection ${collectionName}`)
    })
  }

  // This only removes a specific collection's objects
  __removeAllCollectionDocuments (collectionName, fn) {
    // console.log("SecureStorage: invoked __removeAllDocuments");
    const self = this
    const numberOfDocuments = Object.keys(self.store[collectionName] || {}).length
    self.store[collectionName] = {}
    setTimeout(function () {
      fn(null, numberOfDocuments)
    })
  }

  // This completely removes all objects saved
  __removeAllData (fn) {
		//// console.log("SecureStorage: invoked __removeAllData");
		SecureStoragePlugin.keys().then((responseData) => {
      // console.log(responseData);
      let arrayIndex = responseData.value.findIndex((value, index) => {
        if (value.includes("migratedOldIOSApp")) { // We use includes instead of equality to maintain web functionality
          return true
        }
      })

      let deleteArray = responseData.value;
      deleteArray.splice(arrayIndex, 1)
      deleteArray.forEach(element => {
        // for web purposes, replace cap_sec_ with ''
        let collectionToRemove = element.replace('cap_sec_', '')
        console.log("Do remove: " + collectionToRemove);
        SecureStoragePlugin.remove({ key: collectionToRemove })
      });
      setTimeout(2000);
		}).then(() => {
      location.reload()
    }).catch(error => {
			// console.log("SecureStorage: Invoke removeAllData failed")
			// console.log(error);
			fn(error, null);
		});
  }
}
export default DocumentPersister
