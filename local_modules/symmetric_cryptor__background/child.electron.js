// Copyright (c) 2014-2017, MyMonero.com
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
"use strict"
//
const document_cryptor = require('../symmetric_cryptor/document_cryptor')
const child_ipc = require('../electron_background/child_ipc.electron')
//
//
// Declaring tasks:
//
const tasksByName =
{
	New_EncryptedDocument__Async: function(
		taskUUID,
		plaintextDocument, 
		documentCryptScheme, 
		password
	)
	{
		// console.time("encrypting " + taskUUID)
		document_cryptor.New_EncryptedDocument__Async(
			plaintextDocument, 
			documentCryptScheme, 
			password,
			function(err, encryptedDocument)
			{
				// console.timeEnd("encrypting " + taskUUID)
				child_ipc.CallBack(taskUUID, err, encryptedDocument)
			}
		)
	},
	New_DecryptedDocument__Async: function(
		taskUUID,
		encryptedDocument, 
		documentCryptScheme, 
		password
	)
	{
		// console.time("decrypting " + taskUUID)
		document_cryptor.New_DecryptedDocument__Async(
			encryptedDocument,
			documentCryptScheme,
			password,
			function(err, plaintextDocument)
			{
				// console.timeEnd("decrypting " + taskUUID)
				child_ipc.CallBack(taskUUID, null, plaintextDocument)
			}
		)
	}
}
//
//
// Kicking off runtime:
//
child_ipc.InitWithTasks_AndStartListening(tasksByName)