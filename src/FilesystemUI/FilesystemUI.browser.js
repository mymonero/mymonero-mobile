'use strict'

import FilesystemUI_Abstract from './FilesystemUI_Abstract'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
// import { Device } from '@capacitor/device';
import { FilePicker } from '@mymonero/capacitor-file-picker'
import { Share } from '@capacitor/share'
class FilesytemUI extends FilesystemUI_Abstract {
  // async function to save URI to disk
  async fileWrite (filename, encoding, data) {
    try {
      if (this.context.deviceInfo.platform == 'ios') {
        const finalPhotoUri = await Filesystem.getUri({
          directory: Directory.Documents,
          path: filename,
        });
        Share.share({
          title: filename,
          text: "MyMonero payment request",
          dialogTitle: "MyMonero payment request",
          url: finalPhotoUri.uri
        })
      } else {
        const result2 = await Filesystem.writeFile({
          path: filename,
          data,
          directory: Directory.Documents
        })
      }
    } catch (e) {
      console.error(e.message)
      console.error('Unable to write file', e)
    }
  }

  async fileWriteString (filename, data) {
    try {
      const result2 = await Filesystem.writeFile({
        path: filename,
        data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      })

      const finalPhotoUri = await Filesystem.getUri({
        directory: Directory.Documents,
        path: filename,
      });
      Share.share({
        title: filename,
        url: finalPhotoUri.uri
      })

    } catch (e) {
      console.error(e.message)
      console.error('Unable to write file', e)
    }
  }

  async PresentDialogToSaveBase64ImageStringAsImageFile (
    imgData_base64String,
    title,
    defaultFilename_sansExt,
    fn // (err?) -> Void
  ) {
    const self = this
    if (self.context.deviceInfo.platform == 'web') {
      const a = document.createElement('a')
      a.href = imgData_base64String
      // a.href = "data:image/png;base64,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";
      a.download = 'PaymentRequestQR.png'
      document.body.appendChild(a)
      console.log(a)
      a.click()
      // window.location.href = a.href;
      event.preventDefault()
      fn()
    } else {
      // If we're running Capacitor, we'll save it to the default "DOCUMENTS" folder
      // The first time this call is invoked on the device, it will ask for permissions
      // 2020-12-15 12:53:06.975 10787-10787/com.mymonero.android V/Capacitor/Filesystem: Permission 'android.permission.WRITE_EXTERNAL_STORAGE' is granted
      // 2020-12-15 12:53:06.978 10787-10787/com.mymonero.android E/Capacitor/Filesystem: Not able to create 'DOCUMENTS'!
      // 2020-12-15 12:53:06.978 10787-10787/com.mymonero.android D/Capacitor: Sending plugin error: {"save":false,"callbackId":"36944607","pluginId":"Filesystem","methodName":"writeFile","success":false,"error":{"message":"NOT_CREATED_DIR"}}
      const filename = 'MyMonero-Payment-Request-' + Date.now() + '.png'
      const writtenFile = await self.fileWrite(filename, Encoding.UTF8, imgData_base64String)
      console.log(writtenFile)
      fn()
    }

    //
    // We either are running a Capacitor app (use Filesystem plugin) or the web fallback (for development). For the latter, we should fall back to running the code below
    // alert("Code fault: PresentDialogToSaveBase64ImageStringAsImageFile not yet implemented")
  }

  async PresentDialogToSaveTextFile (
    contentString,
    title,
    defaultFilename_sansExt,
    ext,
    fn,
    optl_uriContentPrefix
  ) {
    if (typeof optl_uriContentPrefix === 'undefined' || !optl_uriContentPrefix) {
      throw 'PresentDialogToSaveTextFile expected optl_uriContentPrefix'
    }

    const self = this
    if (self.context.deviceInfo.platform == 'web') {
      const uriContent = optl_uriContentPrefix + contentString
      const encodedUri = encodeURI(uriContent)
      const link = document.createElement('a')
      link.style.visibility = 'hidden'
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `${defaultFilename_sansExt}.${ext}`)
      document.body.appendChild(link) // Required for FF
      //
      link.click()
      //
      link.parentNode.removeChild(link)
      fn()
    } else {
      const uriContent = optl_uriContentPrefix + contentString
      // If we're running Capacitor, we'll save it to the default "DOCUMENTS" folder
      // The first time this call is invoked on the device, it will ask for permissions
      // 2020-12-15 12:53:06.975 10787-10787/com.mymonero.android V/Capacitor/Filesystem: Permission 'android.permission.WRITE_EXTERNAL_STORAGE' is granted
      // 2020-12-15 12:53:06.978 10787-10787/com.mymonero.android E/Capacitor/Filesystem: Not able to create 'DOCUMENTS'!
      // 2020-12-15 12:53:06.978 10787-10787/com.mymonero.android D/Capacitor: Sending plugin error: {"save":false,"callbackId":"36944607","pluginId":"Filesystem","methodName":"writeFile","success":false,"error":{"message":"NOT_CREATED_DIR"}}
      console.log('Running native capacitor -- attempt to write file')
      console.log('Writing: ' + uriContent)
      const writtenFile = await self.fileWriteString(`${defaultFilename_sansExt}.${ext}`, uriContent).then((writtenFile) => {
        console.log(writtenFile)
        fn()
      })
    }
  }

  //
  //
  // Runtime - Imperatives - Dialogs - Open
  //
  async PresentDialogToOpenOneImageFile (
    title,
    callbackForBase64String // (err?, absoluteFilePath?) -> Void
  ) {
    const self = this
    const params = { title, callbackForBase64String }
    const fileSelection = self.invokeFileBrowser(title, callbackForBase64String); // errors handled by invokeFileBrowser
  }
  async invokeFileBrowser (
    title,
    callbackForPresentDialogToOpenOneImageFile // (err?, absoluteFilePath?) -> Void
  ) {
    const self = this
    if (self.context.deviceInfo.platform == 'web') {
      console.warn('Picking a file on web falls back to a static PNG source')
      let imageBase64String = 'data:image/png;base64,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'
      callbackForPresentDialogToOpenOneImageFile(null, imageBase64String);
      return 
    } 

    const multiple_selection = false
    // let ext = [".jpg",".png",".pdf",".jpeg"] // list of extensions
    // let ext = ["MP3", "ImaGes"] // combination of extensions or category
    let ext = ['videos', 'audios', 'images'] // list of all category
    // let ext = ["*"] // Allow any file type
    ext = ext.map(v => v.toLowerCase())
    const formData = new FormData()

    try {
      let fileImageData = await FilePicker.showFilePicker({
        fileTypes: []
      });

      const fileDataReadResult = await Filesystem.readFile({
        path: fileImageData.uri
      })

      const imgBase64String = 'data:' + fileImageData.mimeType + ';base64,' + fileDataReadResult.data

      callbackForPresentDialogToOpenOneImageFile(null, imgBase64String);
    } catch (error) {
      callbackForPresentDialogToOpenOneImageFile(error, null);
    }
    
    if (self.context.deviceInfo.platform !== 'android' || self.context.deviceInfo.platform !== 'ios' || self.context.deviceInfo.platform !== 'web') {
      // console.log()
    } else {
      console.error("deviceInfo.platform not equal to android, ios or web");
    }
    //alert("Code fault: PresentDialogToOpenOneImageFile not yet implemented")
  }
}
export default FilesytemUI
