(function(){

    var __controller__ = {
        
        name: 'Email_Settings',

        script: '',
		
        initial: function () {
            var settings = this.readSettings();
			
            if (settings == null) {
                settings = {};
            }

            GeckoJS.FormHelper.unserializeFromObject('settingForm',settings);
        },
		
        readSettings: function() {
            var settings = GeckoJS.Configure.read('vivipos.fec.settings.acl_ims_email_settings') || {};

            return settings;
        },


        writeSettings: function(setting) {
            if(!setting) return ;

            GeckoJS.Configure.write('vivipos.fec.settings.acl_ims_email_settings' , setting);
        },


        isAlphaNumeric: function(str) {
            var nonalphaRE = /[^a-zA-Z0-9]/;

            return !nonalphaRE.test(str);
        },

        validateForm: function(data) {
            data.changed = this.Form.isFormModified('settingForm');
        },
       
        save: function() {
            var data = {
                cancel: false,
                changed: false
            };

            $do('validateForm', data, 'Email_Settings');

            if (data.changed) {
                this.update();

                OsdUtils.info(_('Changes saved'));

                return true;
            }
            else {
                NotifyUtils.warn(_('No changes to save'));
            }
            return !data.cancel;
        },

        update: function() {
            var obj = this.Form.serializeToObject('settingForm', false);

            this.Form.unserializeFromObject('settingForm', obj);

            this.writeSettings(obj);
        },

        exit: function() {
            if (this.Form.isFormModified('settingForm')) {
                var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                .getService(Components.interfaces.nsIPromptService);
                var check = {
                    data: false
                };
                var flags = prompts.BUTTON_POS_0 * prompts.BUTTON_TITLE_IS_STRING +
                prompts.BUTTON_POS_1 * prompts.BUTTON_TITLE_CANCEL +
                prompts.BUTTON_POS_2 * prompts.BUTTON_TITLE_IS_STRING;

                var action = prompts.confirmEx(this.topmostWindow,
                    _('Exit'),
                    _('You have made changes to report email configuration. Save changes before exiting?'),
                    flags, _('Save'), '', _('Discard Changes'), null, check);
                if (action == 1) {
                    return;
                }
                else if (action == 0) {
                    if (!this.save()) return;
                }
            }
            window.close();
        }

    };

    GeckoJS.Controller.extend(__controller__);

    window.addEventListener('load', function() {
        $do('initial', null, 'Email_Settings');
    }, false);

})();
