sap.ui.controller("hcm.fab.mytimeevents.com.erco.timeevents.controller.ChangeViewCustom", {

    /**
    * Called when the Controller to load view with data.
	*/
	initializeView: function () {
			this._nCounterS2 = 0;
			var exchgModel = this.getGlobalModel("exchangeModel");
			if (exchgModel) {
				var data = exchgModel.getData();
				this.data = data;
				this.setDateInCalendar(data.EventDate);
				var date = this.formatDate(data.EventTime.ms);
				this.byId("CICO_TIME").setDateValue(date);
				if (data.Origin != "E") {
					this.byId("CICO_TIME").setEnabled(false);
				} else {
					this.byId("CICO_TIME").setEnabled(true);
				}
				if (data.Status === "POSTED") {
					this.byId("pastComments").setVisible(true);
					this.byId("pastCommentsLableId").setVisible(true);
					this.byId("pastComments").setValue(data.Note);
					this.byId("comments").setValue("");
				} else {
					this.byId("pastComments").setVisible(false);
					this.byId("pastCommentsLableId").setVisible(false);
					this.byId("pastComments").setValue("");
					this.byId("comments").setValue(data.Note);
				}
				this.getConfiguration();
				this.getEvents();
				this.getTimeEventTypeSet();
				this.byId("idTimeEventType").setSelectedKey(data.TimeType);
				this.onSelectionChange(null, data.TimeType);
				if (data.ApproverPernr === "00000000") {
					this.byId("approver").setValue(this.configuration.ApproverName);
					this.approverIdSelected = this.configuration.ApproverPernr;
				} else {
					this.byId("approver").setValue(data.ApproverName);
					this.approverIdSelected = data.ApproverPernr;
				}

				if (!this.data.change) {
					this.byId("CICO_TIME").setEnabled(false);
					this.byId("comments").setEnabled(false);
					this.byId("idTimeEventType").setEnabled(false);
					this.byId("approver").setEnabled(false);
					this.byId("save").setVisible(false);
					this.byId("delete").setVisible(false);
					this.byId("pageTitle").setText(this.oBundle.getText("displayTimeEvent"));
					// this.byId("page").setShowFooter(false);
				} else {
					this.byId("idTimeEventType").setEnabled(true);
					this.byId("save").setVisible(true);
					if (data.Origin != "E") {
						this.byId("delete").setVisible(false);
					} else {
						this.byId("delete").setVisible(true);
					}
					this.byId("pageTitle").setText(this.oBundle.getText("changeTimeEvent"));
					// this.byId("page").setShowFooter(true);
				}

                this._setCustomConfig(data);

			} else {
				this.getRouter().navTo("overview", {}, true);
			}
		},

    _setCustomConfig: function(data){

        let oSelect = this.getView().byId("idTimeEventType");
       //oSelect.setSelectedKey(data.AttabsReason); //Extend ChangeView.view and set the "Select" key as AttabsReason instead of TimeType

	   let items = oSelect.getItems();
	   let matchingItem = items.filter(function(item) {
		   let itemData = item.getBindingContext("timeEventType").getObject();
		   return itemData.ZattAbsReason === data.AttabsReason;
	   });

	   oSelect.setSelectedItem(matchingItem[0]);

	   let oTimeType = this.getView().byId("ADDFIELDS");
        oTimeType.setVisible(false);

    }

});