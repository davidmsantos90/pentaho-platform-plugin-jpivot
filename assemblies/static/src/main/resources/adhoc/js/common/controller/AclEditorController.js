/*
* Copyright 2002 - 2019 Hitachi Vantara.  All rights reserved.
*
* This software was developed by Hitachi Vantara and is provided under the terms
* of the Mozilla Public License, Version 1.1, or any later version. You may not use
* this file except in compliance with the license. If you need a copy of the license,
* please go to http://www.mozilla.org/MPL/MPL-1.1.txt. TThe Initial Developer is Pentaho Corporation.
*
* Software distributed under the Mozilla Public License is distributed on an "AS IS"
* basis, WITHOUT WARRANTY OF ANY KIND, either express or  implied. Please refer to
* the license for the specific language governing your rights and limitations.
*/

AclEditorController = function(dialog) {
  this.dialog = dialog;

  this.dialog.setTitle(AclEditorController.DIALOG_TITLE);
  this.aclCtrl = dialog.getAclEditorCtrl();
  this.dialog.enableOkBtnEl(false);

  var localThis = this;

  dialog.setOnSaveHandler(function(event) {
    var value = localThis.aclCtrl.getValue();
    localThis.saveAcl( value );
  });

  dialog.setOnCancelHandler(function(event) {
    localThis.dialog.hide();
  });

  // as soon as any checkbox is modified, enable the Ok button
  this.aclCtrl.setOnItemCheckHandler(function(event) {
    localThis.dialog.enableOkBtnEl( localThis.canEnableOkBtn() );
  });
};

/*private static*/
AclEditorController.PENTAHO_HTTP_WEBSERVICE_URL = "../ServiceAction";

/*private static*/
AclEditorController.SOLUTION_REPOSITORY_WEBSERVICE_URL = "../SolutionRepositoryService";

// TODO sbarkdull, need to localize text
/*private static*/
AclEditorController.FILE_LABEL = Messages.getString("PATH_LABEL");

/*private static*/
AclEditorController.DIALOG_TITLE = Messages.getString("SHARE_PERMISSIONS");

/**
 *
 */
AclEditorController.prototype.loadPage = function(solution, path, filename) {
  this.solution = solution;
  this.path = path;
  this.filename = filename;

  var title = AclEditorController.FILE_LABEL + "/" + solution + ( path != "" ? "/" : "" ) + path + "/" + filename;
  this.aclCtrl.setTitle(title);

  var localThis = this;

  this.loadUsers(function(xmlDoc) {
    if (undefined != xmlDoc) {
      var errorMsg = XmlUtil.getErrorMsg(xmlDoc);
      if (!errorMsg) {
        localThis.aclCtrl.setUsers( xmlDoc );
      } else {
        alert( errorMsg );  // TODO sbarkdull, better msg UI?
      }
    }


    localThis.loadRoles(function(xmlDoc) {
      if (undefined != xmlDoc) {
        var errorMsg = XmlUtil.getErrorMsg( xmlDoc );
        if (!errorMsg) {
          localThis.aclCtrl.setRoles( xmlDoc );
        } else {
          alert( errorMsg );  // TODO sbarkdull, better msg UI?
        }
      }

      localThis.loadAcl(function(xmlDoc) {
        if (undefined != xmlDoc) {
          var errorMsg = XmlUtil.getErrorMsg( xmlDoc );
          if (!errorMsg) {
            localThis.aclCtrl.setAcl( xmlDoc );
          } else {
            alert( errorMsg );  // TODO sbarkdull, better msg UI?
          }
        }
      }); // end loadAcl --------------------------

    }); // end loadRoles --------------------------
  });
};

AclEditorController.prototype.saveAcl = function(strXml) {
  // TODO sbarkdull, show "working" and "hour glass", see WAQR code
  this.dialog.enableOkBtnEl(false);
  this.dialog.enableCancelBtnEl(false);

  var url = AclEditorController.SOLUTION_REPOSITORY_WEBSERVICE_URL;
  var parameters = {
    solution: this.solution,
    path: this.path,
    filename: this.filename,
    aclXml: strXml
  };

  var localThis = this;

  WebServiceProxy.post(url, "setAcl", parameters, function(xmlDoc) {
      localThis.dialog.enableOkBtnEl(true);
      localThis.dialog.enableCancelBtnEl(true);

      if (undefined != xmlDoc) {
        var errorMsg = XmlUtil.getErrorMsg(xmlDoc);
        if (errorMsg) {
          alert(errorMsg);  // TODO sbarkdull, better msg UI?
        } else {
          localThis.dialog.hide();

          // NO NEED TO SHOW DIALOG SAYING SAVE WORKED, USEFUL FOR DEBUGGING
          // var statusMsg = XmlUtil.getStatusMsg(xmlDoc);
          // if (statusMsg) {
          //     alert( statusMsg );
          // }
        }
      }
    }
  );
};

AclEditorController.prototype.loadAcl = function(onLoadHandler) {
  var url = AclEditorController.SOLUTION_REPOSITORY_WEBSERVICE_URL;
  var parameters = {
    solution: this.solution,
    path: this.path,
    filename: this.filename
  };

  WebServiceProxy.post(url, "getAcl", parameters, onLoadHandler);
};

AclEditorController.prototype.loadUsers = function(onLoadHandler) {
  var url = AclEditorController.PENTAHO_HTTP_WEBSERVICE_URL;
  var parameters = {
    action:"securitydetails",
    details:"users"
  };

  WebServiceProxy.post(url, undefined, parameters, onLoadHandler);
};

AclEditorController.prototype.loadRoles = function(onLoadHandler) {
  var url = AclEditorController.PENTAHO_HTTP_WEBSERVICE_URL;
  var parameters = {
    action:"securitydetails",
    details:"roles"
  };

  WebServiceProxy.post(url, undefined, parameters, onLoadHandler);
};

AclEditorController.prototype.canEnableOkBtn = function() {
  return true;
};
