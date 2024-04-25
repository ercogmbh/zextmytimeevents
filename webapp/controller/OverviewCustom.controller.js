

sap.ui.controller("hcm.fab.mytimeevents.com.erco.timeevents.controller.OverviewCustom", {

	showFavoriteDialog: function () {
		var that = this;
		var b = new sap.ui.model.Filter({
		 path: "EmployeeID",
		 operator: sap.ui.model.FilterOperator.EQ,
		 value1: this.empID
		});
		var f = [];
		f.push(b);
		var oModel = new sap.ui.model.json.JSONModel();
		var mParameters = {
		 filters: f, // your Filter Array
		 success: function (oData, oResponse) {
		  var a = oData;
		  oModel.setData(a.results);
		  that.hideBusy();
		 },
		 error: function (oError) {
		  that.processError(oError);
		 }
		};
		this.showBusy();
		this.oDataModel
		 .read(
		  "/FavoritesSet",
		  mParameters);
	   },
	 

		onSaveFavorite: function (oEvent) {
			var oView = this.getView();
			var oDialog = oView.byId("favoriteDialog");
			// create dialog lazily
			if (!oDialog) {
				var oDialogController = {
					handleConfirm: this.handleConfirm.bind(this),
					handleSearch: this.handleSearchEventTypes.bind(this),
					handleClose: function (oEvt) {
						var binding = oEvt.getSource().getBinding("items");
						//remove older search Filters
						var removeFilter = [];
						if ( binding ){
							binding.filter(removeFilter, "Application");
						}
					}
				};
				// create dialog via fragment factory
				//Anforderung Meine Zeitbuchungen - Begründungsspalte einfügen (8100087313) - ESS - INS - BEG
				oDialog = sap.ui.xmlfragment(oView.getId(), "hcm.fab.mytimeevents.com.erco.timeevents.view.fragments.FavoritesDialogCustom",
					oDialogController);
				//Anforderung Meine Zeitbuchungen - Begründungsspalte einfügen (8100087313) - ESS - INS - END
				// connect dialog to view (models, lifecycle)
				oView.addDependent(oDialog);
			}
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);

			oDialog.open();

		},

		onFavPress: function (oEvent) {
			var selectedItem = oEvent.getSource().data();
			selectedItem.date = new Date();
			var dateString = sap.ui.core.format.DateFormat.getDateInstance({
				style: "medium"
			}).format(new Date());
			var timeString = sap.ui.core.format.DateFormat.getTimeInstance({
				style: "medium"
			}).format(new Date());;
			var addInfo = [{
				label: this.oBundle.getText("eventType"),
				text: selectedItem.SubtypeText
			}, {
				label: this.oBundle.getText("date"),
				text: dateString
			}, {
				label: this.oBundle.getText("time"),
				text: timeString
			}];
			//Anforderung Meine Zeitbuchungen - Begründungsspalte einfügen (8100087313) - ESS - INS - BEG
			this.ZattAbsReasonQuickEntry = selectedItem.ZattAbsReason;
			//Anforderung Meine Zeitbuchungen - Begründungsspalte einfügen (8100087313) - ESS - INS - END 
			//set up the settings tab
			var oSettings = {
				showNote: false,
				title: this.oBundle.getText("submissionConfirmation"),
				confirmButtonLabel: this.oBundle.getText("OK"),
				additionalInformation: addInfo
			};
			//open confirmation popup
			this.openConfirmationPopup(oSettings, 'F', selectedItem);

		},

		getEventTypes: function (oPernr) {
			var that = this;
			var oDate = new Date();
			if (arguments[1]) {
				if (arguments[1].getUTCFullYear() != new Date().getUTCFullYear()) {
					arguments[1] = new Date();
				}
				arguments[1].setHours(23, 59, 59);
			} else {
				oDate.setHours(23, 59, 59);
			}
			var a = new sap.ui.model.Filter({
				path: "EmployeeID",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.empID
			});
	
			var b = new sap.ui.model.Filter({
				path: "EventDate",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: (arguments[1] === null || arguments[1] === undefined) ? this.oFormatYyyymmdd.format(oDate) : this.oFormatYyyymmdd.format(
					arguments[1])
			});
	
			var f = [];
			f.push(a);
			f.push(b);
			var oModel = new sap.ui.model.json.JSONModel();
			var mParameters = {
				filters: f, // Filter Array
				success: function (oData, oResponse) {
					var a = oData;
					var oFavorites = that.getModel('FavoritesSet').getData();
					for (var i = 0; i < oFavorites.length; i++) {
						for (var j = 0; j < a.results.length; j++) {
							if (oFavorites[i].Subtype == a.results[j].TimeType && oFavorites[i].ZattAbsReason == a.results[j].ZattAbsReason) {
								a.results[j].selected = true;
							}
						}
					}
					//Anforderung Meine Zeitbuchungen - Begründungsspalte einfügen (8100087313) - ESS - INS - BEG
					let aData = a.results;
					//let aDataMap = aData.filter(item => !item.Iscustom);
					let aDataMap = aData;
					let oModeltimeEventType = new sap.ui.model.json.JSONModel();
					oModeltimeEventType.setData(aDataMap)
					that.setModel(oModeltimeEventType, "timeEventType");
					that.setGlobalModel(oModeltimeEventType, "eventTypeModel");
	
					aDataMap = aData;//aData.filter(item => item.Iscustom);
					let oModeltimeEventTypeFav = new sap.ui.model.json.JSONModel();
					oModeltimeEventTypeFav.setData(aDataMap)
					that.setModel(oModeltimeEventTypeFav, "timeEventTypeFav");
					//Anforderung Meine Zeitbuchungen - Begründungsspalte einfügen (8100087313) - ESS - INS - END
					that.byId("createForm").setBusy(false);
	
				},
				error: function (oError) {
					that.processError(oError);
				}
			};
	
			this.oDataModel
				.read(
					"/TimeEventTypeSet",
					mParameters);
	
		},
	


		handleConfirm: function (oEvent) {
			var that = this;
			var eventsList = oEvent.getSource().getBinding("items").oList;
			var selectedItems = [];
			var l = 0;
			for (var n = 0; n < eventsList.length; n++) {
				if (eventsList[n].selected) {
					selectedItems[l] = eventsList[n];
					l++;
				}
			}
			var oModel = this.oDataModel;
			oModel.setChangeBatchGroups({
				"*": {
					groupId: "Favorites",
					changeSetId: "Favorites",
					single: false
				}
			});
			oModel.setDeferredGroups(["Favorites"]);
			oModel
				.refreshSecurityToken(
					function (oData) {
						if (selectedItems.length > 0) {
							for (var i = 0; i < selectedItems.length; i++) {
								//Anforderung Meine Zeitbuchungen - Begründungsspalte einfügen (8100087313) - ESS - INS - BEG
								var obj = {
									properties: {
										EmployeeID: that.empID,
										Subtype: selectedItems[i].TimeType,
										SubtypeText: selectedItems[i].TimeTypeText,
										ZattAbsReason: selectedItems[i].ZattAbsReason
									},
									//Anforderung Meine Zeitbuchungen - Begründungsspalte einfügen (8100087313) - ESS - INS - END 
									success: function (oData) {
										var toastMsg = that.oBundle.getText("favoriteCreated");
										sap.m.MessageToast.show(toastMsg, {
											duration: 1000
										});
										that.getFavorites();
										that.getEventTypes();
										that.calendar.removeAllSelectedDates();
										that.calendar.addSelectedDate(new sap.ui.unified.DateRange({
											startDate: new Date(),
											endDate: new Date()
										}));
										that.selectedDate = new Date();
										that.getEvents(that.selectedDate);
									},
									error: function (oError) {
										that.processError(oError);
									},
									changeSetId: "Favorites",
									groupId: "Favorites"
								};
								oModel
									.createEntry(
										"/FavoritesSet",
										obj);
							}
						} else {
							var obj = {
								properties: {
									EmployeeID: that.empID,
									Subtype: " ",
									SubtypeText: " "
								},
								success: function (oData) {
									var toastMsg = that.oBundle.getText("favoriteDeleted");
									sap.m.MessageToast.show(toastMsg, {
										duration: 1000
									});
									that.getFavorites();
									that.getEventTypes();
									that.calendar.removeAllSelectedDates();
									that.calendar.addSelectedDate(new sap.ui.unified.DateRange({
										startDate: new Date(),
										endDate: new Date()
									}));
									that.selectedDate = new Date();
									that.getEvents(that.selectedDate);
								},
								error: function (oError) {
									that.processError(oError);
								}

							};
							oModel
								.createEntry(
									"/FavoritesSet",
									obj);
						}
						oModel.submitChanges({
							groupId: "Favorites",
							changeSetId: "Favorites"
						});

					}, true);
		},

		initCalendarLegend: function () {
			if (this.legend) {
				this.legend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("approved"),
					type: sap.ui.unified.CalendarDayType.Type08
				}));
				this.legend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("rejected"),
					type: sap.ui.unified.CalendarDayType.Type03
				}));
				this.legend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("AnAbwesenheit"),
					type: sap.ui.unified.CalendarDayType.Type00
				}));
				this.legend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("holiday"),
					type: sap.ui.unified.CalendarDayType.Type09
				}));
				this.legend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("multiple"),
					type: sap.ui.unified.CalendarDayType.Type10
				}));
			}
			if (this.mlegend) {
				this.mlegend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("approved"),
					type: sap.ui.unified.CalendarDayType.Type08
				}));
				this.mlegend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("rejected"),
					type: sap.ui.unified.CalendarDayType.Type03
				}));
				this.mlegend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: 'An / abwesenheit',
					type: sap.ui.unified.CalendarDayType.Type00
				}));
				this.mlegend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("holiday"),
					type: sap.ui.unified.CalendarDayType.Type09
				}));
				this.mlegend.addItem(new sap.ui.unified.CalendarLegendItem({
					text: this.oBundle.getText("multiple"),
					type: sap.ui.unified.CalendarDayType.Type10
				}));
			}

		},

		initCalendar: function (Pernr) {
			var that = this;
			var f = [];
			var a = new sap.ui.model.Filter({
				path: "EmployeeID",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: Pernr
			});
			var b = new sap.ui.model.Filter({
				path: "DateFrom",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.dateFrom
			});
			this.dateTo.setUTCDate(this.dateTo.getUTCDate() + 1);
			var c = new sap.ui.model.Filter({
				path: "DateTo",
				operator: sap.ui.model.FilterOperator.EQ,
				value1: this.dateTo
			});
			f.push(a);
			if (this.dateFrom && this.dateTo) {
				f.push(b);
				f.push(c);
			}

			var mParameters = {
				filters: f, // Filter Array
				success: function (oData, oResponse) {

					that.calendar.removeAllSpecialDates();
					that.mCalendar.removeAllSpecialDates();
					var a = oData;
					var date;
					for (var i = 0; i < a.results.length; i++) {
						try {
							var date1 = new Date(a.results[i].EventDate);
							var date2 = new Date(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate());
							date = date2;
						} catch (o) {
							date = new Date(a.results[i].EventDate);
						}
						a.results[i].EventDate = date;
						switch (a.results[i].Status) {
							case "APPROVED":
								a.results[i].Type = sap.ui.unified.CalendarDayType.Type08;
								a.results[i].Tooltip = that.oBundle.getText("approved");
								break;
							case "POSTED":
								a.results[i].Type = sap.ui.unified.CalendarDayType.Type08;
								a.results[i].Tooltip = that.oBundle.getText("approved");
								break;
							case "REJECTED":
								a.results[i].Type = sap.ui.unified.CalendarDayType.Type03;
								a.results[i].Tooltip = that.oBundle.getText("rejected");
								break;
							case "SENT":
								a.results[i].Type = sap.ui.unified.CalendarDayType.Type00;
								a.results[i].Tooltip = that.oBundle.getText("sent");
								break;
							case "HOLIDAY":
								a.results[i].Type = sap.ui.unified.CalendarDayType.Type09;
								if (a.results[i].StatusText != "") {
									a.results[i].Tooltip = a.results[i].StatusText;
								} else {
									a.results[i].Tooltip = that.oBundle.getText("holiday");
								}
								break;
							case "NONWORKING":
								a.results[i].Type = sap.ui.unified.CalendarDayType.NonWorking;
								a.results[i].Tooltip = that.oBundle.getText("nonworking");
								break;
							case "CUSTOM":
								a.results[i].Type = sap.ui.unified.CalendarDayType.Type00;
								a.results[i].Tooltip = that.oBundle.getText("AnAbwesenheit");
								break;
						}
						that.calendar.addSpecialDate(new sap.ui.unified.DateTypeRange({
							startDate: new Date(a.results[i].EventDate),
							type: a.results[i].Type,
							tooltip: a.results[i].Tooltip
						}));
						that.mCalendar.addSpecialDate(new sap.ui.unified.DateTypeRange({
							startDate: new Date(a.results[i].EventDate),
							type: a.results[i].Type,
							tooltip: a.results[i].Tooltip
						}));

					}
					that.calendar.setBusy(false);
				},
				error: function (oError) {
					that.calendar.setBusy(false);
					that.processError(oError);
				}
			};
			this.byId('calendar').setBusy(true);
			this.oDataModel
				.read(
					"/TimeEventSet",
					mParameters);
		},

		createTimeEvent: function (isFav, customData) {
			var that = this;
			var date = new Date();
			this.showBusy();
			// Determine correct start month index
			var startMonthIndex;
			if (isFav) {
				var obj = this.createPostObject('F', customData);

				if (customData.SubtypeText.includes("Telearbeit")){
					obj.AttabsReason = "0416";
				} else if (customData.SubtypeText.includes("Arbeit zu Hause")) {
					obj.AttabsReason = "0415";
				} else {
					obj.AttabsReason = " ";
				}


				this.selectedDate = new Date();
				if (this.selectedDate.getMonth() % 2 == 0) {
					startMonthIndex = this.selectedDate.getMonth();
				} else {
					startMonthIndex = this.selectedDate.getMonth() - 1;
				}
				date.setMonth(startMonthIndex, 1);
				this.dateFrom = date;
				date = new Date();
				if (sap.ui.Device.system.desktop === true) {
					date.setMonth(startMonthIndex + 2, 0);
				} else {
					date.setMonth(startMonthIndex + 1, 0);
				}
				this.dateTo = date;
			} else {
				var obj = this.createPostObject('C');

				if (customData.SubtypeText.includes("Telearbeit")){
					obj.AttabsReason = "0416";
				} else if (customData.SubtypeText.includes("Arbeit zu Hause")) {
					obj.AttabsReason = "0415";
				} else {
					obj.AttabsReason = " ";
				}

				var selectedMonth = this.getSelectedDate().getMonth();
				if (selectedMonth % 2 == 0) {
					startMonthIndex = selectedMonth;
				} else {
					startMonthIndex = selectedMonth - 1;
				}
				date.setMonth(startMonthIndex, 1);
				date.setYear(this.getSelectedDate().getFullYear());
				this.dateFrom = date;
				date = new Date();
				date.setYear(this.getSelectedDate().getFullYear());
				if (sap.ui.Device.system.desktop === true) {
					date.setMonth(startMonthIndex + 2, 0);
				} else {
					date.setMonth(startMonthIndex + 1, 0);
				}
				this.dateTo = date;
			}

			if (obj.AttabsReason === 'XXXX') {
				obj.AttabsReason = '';
			}

			this.oDataModel
				.create("/TimeEventSet", obj, {
					success: function (oData, oResponse) {
						that.hideBusy();
						var toastMsg = that.oBundle.getText("timeEventCreated");
						sap.m.MessageToast.show(toastMsg, {
							duration: 1000
						});

						if (sap.ui.Device.system.phone === true) {
							that.mCalendar.setDateValue(that.selectedDate);
						} else {

							that.calendar.removeAllSelectedDates();
							that.calendar.addSelectedDate(new sap.ui.unified.DateRange({
								startDate: that.selectedDate,
								endDate: that.selectedDate
							}));
							that.calendar.focusDate(that.selectedDate);
							that.calendar.fireStartDateChange();
						}
						that.getEvents(that.selectedDate);
					},
					error: function (oError) {
						that.hideBusy();
						that.processError(oError);
					}
				});
		},

		createPostObject: function (type, customData) {
			var timeformatter = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: this.byId("timePicker").getDisplayFormat()
			});
			var dateformatter = sap.ui.core.format.DateFormat.getTimeInstance({
				pattern: this.byId("datePicker").getDisplayFormat()
			});
			if (type === 'C') {
				var time = this.formatTimeString(this.byId("timePicker").getDateValue());
				var eventDate = this.formatDateTimeString(this.byId("datePicker").getDateValue());
				var timezoneOffset = this.byId("datePicker").getDateValue().getTimezoneOffset() / (-60);
				var timeType = this.byId("idTimeEventType").getSelectedKey();
				timezoneOffset = timezoneOffset.toFixed(2);
				this.selectedDate = this.byId("datePicker").getDateValue();
				this.setSelectedDate(this.selectedDate);
				var postObj = {
					EmployeeID: this.empID,
					EventDate: eventDate,
					EventTime: time,
					TimeType: timeType,
					TimezoneOffset: timezoneOffset.toString()
				};
				//Additional Fields
				for (var i = 0; i < this.byId('ADD_FIELDS').getFormElements().length; i++) {
					if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[0].getVisible()) {
						postObj[this.byId('ADD_FIELDS').getFormElements()[i].getFields()[0].getCustomData()[0].getValue()] = this.byId('ADD_FIELDS').getFormElements()[
							i].getFields()[0].getValue();
					} else if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[1].getVisible()) {
						postObj[this.byId('ADD_FIELDS').getFormElements()[i].getFields()[1].getCustomData()[0].getValue()] = this.byId('ADD_FIELDS').getFormElements()[
							i].getFields()[1].getValue();
					} else if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[2].getVisible()) {
						postObj[this.byId('ADD_FIELDS').getFormElements()[i].getFields()[2].getCustomData()[0].getValue()] = this.byId('ADD_FIELDS').getFormElements()[
							i].getFields()[2].getValue();
					} else if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[3].getVisible()) {
						if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[3].getDateValue()) {
							postObj[this.byId('ADD_FIELDS').getFormElements()[i].getFields()[3].getCustomData()[0].getValue()] = this.formatDateTimeString(
								this.byId('ADD_FIELDS').getFormElements()[
									i].getFields()[3].getDateValue());
						}
					} else if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[4].getVisible()) {
						if (this.byId('ADD_FIELDS').getFormElements()[i].getFields()[4].getDateValue()) {
							postObj[this.byId('ADD_FIELDS').getFormElements()[i].getFields()[4].getCustomData()[0].getValue()] = this.formatTimeString(this
								.byId('ADD_FIELDS').getFormElements()[
								i].getFields()[4].getDateValue());
						}
					}

				}

			} else if (type === 'F') {
				var time = this.formatTimeString(customData.date);
				var eventDate = this.formatDateTimeString(customData.date);
				var timezoneOffset = customData.date.getTimezoneOffset() / (-60);
				var timeType = customData.Subtype;
				timezoneOffset = timezoneOffset.toFixed(2);
				//Anforderung Meine Zeitbuchungen - Begründungsspalte einfügen (8100087313) - ESS - INS - BEG
				var postObj = {
					EmployeeID: this.empID,
					EventDate: eventDate,
					EventTime: time,
					TimeType: timeType,
					TimezoneOffset: timezoneOffset.toString(),
					AttabsReason: this.ZattAbsReasonQuickEntry
				};
				//Anforderung Meine Zeitbuchungen - Begründungsspalte einfügen (8100087313) - ESS - INS - END
			} else {
				var time = this.formatTime(customData.time);
				var eventDate = this.formatDateTimeString(customData.date);
				var timezoneOffset = customData.date.getTimezoneOffset() / (-60);
				timezoneOffset = timezoneOffset.toFixed(2);
				var postObj = {
					EmployeeID: this.empID,
					EventDate: eventDate,
					EventTime: time,
					TimeType: timeType,
					TimezoneOffset: timezoneOffset.toString()
				};
			}

			if (this.approverIdSelected && this.configuration.ApproverVisible) {
				postObj.ApproverPernr = this.approverIdSelected;
			} else {
				postObj.ApproverPernr = this.configuration.ApproverId;
			}

			if (this.byId("comments").getValue() !== "") {
				postObj.Note = this.byId("comments").getValue();
			}
			if (type === "D") {
				postObj.ReqId = customData.id;
				postObj.EventTime = customData.time;
			}
			/**
			 * @ControllerHook Modify the post Object
			 * This hook method can be used to modify the object sent for creation or deletion
			 * It is called when the decision options for the detail item are fetched successfully
			 * @callback hcm.cico.view.S1~extHookCreatePostObject
			 * @param {object} Post Object
			 * @param {string} Type
			 * @return {object} Post Object
			 */
			if (this.extHookCreatePostObject) {
				postObj = this.extHookCreatePostObject(postObj, type);
			}
			return postObj;
		}

	});

