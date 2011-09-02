(function() {
    
    include('chrome://viviecr/content/reports/controllers/rpt_base_controller.js');
    include('chrome://viviecr/content/reports/controllers/components/csv_export.js');
    include('chrome://viviecr/content/reports/controllers/components/browser_print.js');
	
    var __controller__ = {

        name: 'EmailPdf',
        
        components: [ 'BrowserPrint', 'CsvExport'],

        _tmpFileDir: '/var/tmp/',
        _wait_panel_id: 'wait_panel',
        _waiting_caption_id: 'waiting_caption',
        _progress_box_id: 'progress_box',
        _progress_bar_id: 'progress',
        _preview_frame_id: 'preview_frame',
        _script_file: 'chrome://ims/content/scripts/mailsent',

        _csvLimit: 3000000,

        settings: {},

        load: function() {
            this.settings = GeckoJS.Configure.read('vivipos.fec.settings.acl_ims_email_settings') || {};
        },

        emailReport: function(data) {

            if (!data) {
                var title = 'Report';
                var rptBaseController = GeckoJS.Controller.getInstanceByName('RptBase');
                if (rptBaseController) {
                    title = rptBaseController._reportRecords.head.title;
                }
                data = {
                    mode: 'report',
                    title: title
                }
            }
            
            var pdfBtn = document.getElementById('export_pdf');

            if (pdfBtn.disabled){
                return;
            }
			
            if (!GREUtils.Dialog.confirm(this.topmostWindow,
                                         _('Confirm Email'),
                                         _('Are you sure you want to email PDF copy of this report?')))
                return;

            var cb = null;

            try {
                var waitPanel = this._showWaitingPanel();
                var progress = document.getElementById('progress');
                var caption = document.getElementById('waiting_caption');
                var cur_file = document.location.href;
                var filename = cur_file.substr(cur_file.lastIndexOf('/')+1);
                filename = filename.substr(0,filename.length-4);

                var fileName = filename + '_' + (new Date()).toString('yyyyMMddHHmm') + '.pdf';
                var tmpFile = this._tmpFileDir + fileName;
                var self = this;

                cb = function() {
                    if (waitPanel != undefined)
                        self._dismissWaitingPanel();
                };

                this.BrowserPrint.printToPdf(tmpFile, {}, this._preview_frame_id, caption, progress,
                    function() {
                       self.doEmail(tmpFile, data, 180, cb);
                    }
                );
            } catch (e) {
                this.doEmail('/tmp/__notexists__', data, '/tmp', 0.1,  cb);
            }
        },
		
        doEmail: function(tmpFile, data, timeout, callback) {
            var mode = data.mode;
            var report_title = data.title;
            var supplier = data.supplier;
            var maxTimes = Math.floor(timeout / 0.2);
            var tries = 0;
            var nsTmpfile;
            var self = this;
            var rsFile = tmpFile + '_' + (new Date()).getTime();

            var checkFn = function() {
                var result = _('A general exception has occurred');
                try {

                    //
                    var caption = document.getElementById(self._waiting_caption_id);
                    var progressBar = document.getElementById(self._progress_bar_id);
                    caption.label = _('Sending to Mail Server...');
                    progressBar.setAttribute('mode', 'undetermined');

                    nsTmpfile = GREUtils.File.getFile(tmpFile);
                    
                    if (nsTmpfile == null) {
                        tries++;
                    } else {
                        //do email here
                        var sender = (self.settings[mode + '_email_sender'] || '').trim();
                        var recipient = (self.settings[mode + '_email_recipient'] || '').trim();
                        var sendMeCopy = self.settings[mode + '_sendMeACopy'] || false;
                        var sendSupplier = self.settings[mode + '_sendSupplier'] || false;
                        if (sendMeCopy) {
                            recipient += ((recipient == '') ? '' : ',') + sender;
                        }
                        if (sendSupplier && supplier && supplier.email) {
                            recipient += ((recipient == '') ? '' : ',') + supplier.email;
                        }
                        var body = self.settings[mode + '_email_body'];
                        var subject = (self.settings[mode + '_email_subject'] || '').trim();
                        if (subject != '') subject += ' ';
                        subject += report_title + (data.id ? (' [' +  data.id + ']') : '') + ' (' + (new Date()).toString('dd-MM-yyyy HH:mm') + ')';

                        var host = (self.settings['smtp_host'] || '').trim();
                        var port = (self.settings['smtp_port'] || '').trim();
                        var username = (self.settings['smtp_username'] || '').trim();
                        var password = (self.settings['smtp_password'] || '').trim();

                        var script_file = GREUtils.File.chromeToPath(self._script_file);
                        var recipients = recipient.split(';');
						
                        self.execute('/usr/bin/python', [script_file, sender, recipients, body, subject, host, port, username, password, tmpFile, rsFile], false);

                        while (GeckoJS.File.exists(tmpFile)) self.sleep(100);
                        
                        var resultStatus = GREUtils.File.readAllLine(rsFile);
                        if (resultStatus.length > 0) {
                            result = resultStatus[0];
                        }

                        tries = maxTimes;
                    }
                    if (tries < maxTimes) {
                        setTimeout(arguments.callee, 200);
                    } else {
                        callback.apply(self);
                    }
                } catch(e) {
                    callback.apply(self);
                }
                if (result == '0') {
                    GREUtils.Dialog.alert(self.topmostWindow,
                                          _('%S Sent', [report_title]),
                                          _('%S successfully emailed', [report_title]));
                }
                else {
                    GREUtils.Dialog.alert(self.topmostWindow,
                                          _('Unable to Email %S', [report_title]),
                                          _('One or more errors occurred while emailing %S\n\n%S', [report_title, result]));
                }
                GREUtils.File.remove(rsFile);
            };
            setTimeout(checkFn, 200);
        },
		
        execute: function(cmd, params, blocking) {
            try {
                var exec = new GeckoJS.File(cmd);
                var r = exec.run(params, blocking);
                exec.close();
                return true;
            }
            catch (e) {
                NotifyUtils.warn(_('Failed to execute command (%S).', [cmd + ' ' + params]));
                GeckoJS.BaseObject.log('FATAL', _('Failed to execute command (%S).', [cmd + ' ' + params]))
                return false;
            }
        },
		
        _dismissWaitingPanel: function() {
            var progressBox = document.getElementById(this._progress_box_id);
            progressBox.removeChild(progressBox.firstChild);
        	
            var waitPanel = document.getElementById(this._wait_panel_id);
            waitPanel.hidePopup();
        },
		
        _showWaitingPanel: function(sleepTime, hideProgressbar) {
            var waitPanel = document.getElementById(this._wait_panel_id);
            var caption = document.getElementById(this._waiting_caption_id);

            caption.label = caption.statusText;

            var progressBox = document.getElementById(this._progress_box_id);
            var progressBar = document.createElementNS('http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul', 'xul:progressmeter');
            progressBar.setAttribute('value', '0');
            progressBar.setAttribute('mode', 'determined');
            progressBar.setAttribute('id', this._progress_bar_id);
            progressBox.appendChild(progressBar);

            progressBox.hidden = hideProgressbar;

            waitPanel.openPopupAtScreen(0, 0);

            // release CPU for progressbar to show up.
            if (!sleepTime) {
                sleepTime = 100;
            }
            this.sleep(sleepTime);

            return waitPanel;
        }
    };

    RptBaseController.extend(__controller__);
	
    // register onload
    window.addEventListener('load', function() {
        $do('load', null, 'EmailPdf')
    }, false);
})();
