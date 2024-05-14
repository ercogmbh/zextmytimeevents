

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
					if (binding) {
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


		/**
		 * Called when application loads confirmation popup.
		 * @public
		 */
		openConfirmationPopup: function (oSettings, isType, selectedItem) {
			var self = this;
			var oElements = [];
			for (var i = 0; i < oSettings.additionalInformation.length; i++) {
				oElements.push(new sap.m.Label({
					text: oSettings.additionalInformation[i].label,
					design: "Bold"
				}));
				oElements.push(new sap.m.Text({
					text: oSettings.additionalInformation[i].text
				}));
			}

			var customData = { "SubtypeText": oSettings.additionalInformation[0].text};

			var oForm = new sap.ui.layout.form.SimpleForm({
				minWidth: 1024,
				editable: false,
				maxContainerCols: 2,
				layout: "ResponsiveGridLayout",
				labelSpanL: 5,
				labelSpanM: 5,
				labelSpanS: 5,
				emptySpanL: 2,
				emptySpanM: 2,
				emptySpanS: 2,
				columnsL: 1,
				columnsM: 1,
				columnsS: 1,
				content: oElements
			});
			var oConfirmDialog = new sap.m.Dialog({
				title: oSettings.title,
				content: [oForm],
				beginButton: new sap.m.Button({
					text: oSettings.confirmButtonLabel,
					press: function (oEvent) {
						var key;
						if (window.event) {
							//store the key code (Key number) of the pressed key 
							key = window.event.keyCode;
							//otherwise, it is firefox 
						} else {
							//store the key code (Key number) of the pressed key 
							key = oEvent.which;
						}
						if (key != 13) {
							if (isType === 'C') {
								self.createTimeEvent(false, customData);
							} else if (isType === 'F') {
								self.createTimeEvent(true, selectedItem);
							} else {
								self._deleteEntry(selectedItem);
							}
							oConfirmDialog.close();
						}

						this.getTimeEvalMessages(this.empID);

					}.bind(this)
				}),
				endButton: new sap.m.Button({
					text: this.oBundle.getText("cancel"),
					press: function () {
						oConfirmDialog.close();
					}
				})
			}).addStyleClass("sapUiContentPadding sapUiMediumMarginTopBottom");
			oConfirmDialog.open();
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

			//ensure time events are reloaded after successful update from change screen		
			_onOverviewRouteMatched: function () {
				var exchgModel = this.getOwnerComponent().getModel("changeExchgModel");
				if (exchgModel && exchgModel.getData().reloadList) {
					var date = exchgModel.getData().loadDate;
					this.getEvents(date);
					this.getTimeEvalMessages(this.empID);
				}
	
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


	/**
	 * Called when user change time event type and will load all additional fields of time event type.
	 * @public
	 */
	onSelectionChange: function (evt, event) {

		// var that = this;
		// var timeTypeCode;
		// if (event) {
		// 	timeTypeCode = event;
		// } else {
		// 	if (evt) {
		// 		var selectdItem = evt.getParameter("selectedItem");
		// 		if (selectdItem) {
		// 			timeTypeCode = selectdItem.getProperty("key");
		// 		}
		// 	}
		// }

		//if (timeTypeCode) {
			// var p = new sap.ui.model.Filter({
			// 	path: "TimeType",
			// 	operator: sap.ui.model.FilterOperator.EQ,
			// 	value1: timeTypeCode
			// });
			// var f = [];
			// f.push(p);
			// var oAddFieldsModel = new sap.ui.model.json.JSONModel();
			// var oFormContainer = that.byId("ADD_FIELDS");
			// oFormContainer.destroyFormElements();
			// var mParameters = {
			// 	filters: f, // your Filter Array
			// 	success: function (oData, oResponse) {
			// 		var AdditionalFields = oData;
			// 		if (AdditionalFields) {
			// 			for (var i = 0; i < AdditionalFields.results.length; i++) {
			// 				switch (AdditionalFields.results[i].TypeKind) {
			// 					case 'D':
			// 						AdditionalFields.results[i].TypeKind = "Date";
			// 						AdditionalFields.results[i].DateVisible = true;
			// 						AdditionalFields.results[i].InputIntegerVisible = false;
			// 						AdditionalFields.results[i].InputDecimalVisible = false;
			// 						AdditionalFields.results[i].InputTextVisible = false;
			// 						AdditionalFields.results[i].TimeVisible = false;
			// 						break;
			// 					case 'N':
			// 						AdditionalFields.results[i].TypeKind = "Number";
			// 						AdditionalFields.results[i].InputIntegerVisible = true;
			// 						AdditionalFields.results[i].InputTextVisible = false;
			// 						AdditionalFields.results[i].InputDecimalVisible = false;
			// 						AdditionalFields.results[i].DateVisible = false;
			// 						AdditionalFields.results[i].TimeVisible = false;
			// 						break;
			// 					case 'P':
			// 						AdditionalFields.results[i].TypeKind = "Number";
			// 						AdditionalFields.results[i].InputIntegerVisible = false;
			// 						AdditionalFields.results[i].InputTextVisible = false;
			// 						AdditionalFields.results[i].InputDecimalVisible = true;
			// 						AdditionalFields.results[i].DateVisible = false;
			// 						AdditionalFields.results[i].TimeVisible = false;
			// 						break;
			// 					case 'C':
			// 						AdditionalFields.results[i].TypeKind = "Text";
			// 						AdditionalFields.results[i].InputTextVisible = true;
			// 						AdditionalFields.results[i].InputIntegerVisible = false;
			// 						AdditionalFields.results[i].InputDecimalVisible = false;
			// 						AdditionalFields.results[i].DateVisible = false;
			// 						AdditionalFields.results[i].TimeVisible = false;
			// 						break;
			// 					case 'T':
			// 						AdditionalFields.results[i].TypeKind = "Time";
			// 						AdditionalFields.results[i].TimeVisible = true;
			// 						AdditionalFields.results[i].DateVisible = false;
			// 						AdditionalFields.results[i].InputDecimalVisible = false;
			// 						AdditionalFields.results[i].InputTextVisible = false;
			// 						AdditionalFields.results[i].InputIntegerVisible = false;
			// 						break;
			// 					default:
			// 						AdditionalFields.results[i].TypeKind = "Text";
			// 						AdditionalFields.results[i].InputTextVisible = true;
			// 						AdditionalFields.results[i].InputIntegerVisible = false;
			// 						AdditionalFields.results[i].InputDecimalVisible = false;
			// 						AdditionalFields.results[i].DateVisible = false;
			// 						AdditionalFields.results[i].TimeVisible = false;
			// 				}
			// 				if (AdditionalFields.results[i].HasF4 === "X") {
			// 					AdditionalFields.results[i].HasF4 = true;
			// 				} else {
			// 					AdditionalFields.results[i].HasF4 = false;
			// 				}

			// 				if (AdditionalFields.results[i].Name === 'ValuationBasis') {
			// 					AdditionalFields.results[i].value = parseFloat("0.00");
			// 				} else if (AdditionalFields.results[i].Name === 'TimeRecIDNo') {
			// 					AdditionalFields.results[i].value = "00000000";
			// 				} else if (AdditionalFields.results[i].Name === 'PremiumID') {
			// 					AdditionalFields.results[i].value = "0000";
			// 				} else if (AdditionalFields.results[i].Name === 'Position') {
			// 					AdditionalFields.results[i].value = "00000000";
			// 				} else if (AdditionalFields.results[i].Name === 'SalesOrderItem') {
			// 					AdditionalFields.results[i].value = "000000";
			// 				}

			// 				oAddFieldsModel.setData(AdditionalFields.results);
			// 				that.setModel(oAddFieldsModel, "AdditionalFields");

			// 				var oFormElement = new sap.ui.layout.form.FormElement({
			// 					label: new sap.m.Label({
			// 						text: "{FieldLabel}"
			// 					}),
			// 					fields: [
			// 						new sap.m.Input({
			// 							value: "{path:'value', type: 'sap.ui.model.type.Integer'}",
			// 							type: "{TypeKind}",
			// 							enabled: "{= ${Readonly} ? false : true}",
			// 							showValueHelp: "{HasF4}",
			// 							valueHelpRequest: that.onValueHelp.bind(that),
			// 							visible: "{InputIntegerVisible}",
			// 							required: "{path:'Required',formatter:'hcm.fab.mytimeevents.utils.formatter.isRequired'}",
			// 							layoutData: new sap.ui.layout.GridData({
			// 								span: "L5 M5 S12"
			// 							}),
			// 							customData: [new sap.ui.core.CustomData({
			// 								"key": "FieldName",
			// 								"value": "{Name}"
			// 							}), new sap.ui.core.CustomData({
			// 								"key": "ValueHelp",
			// 								"value": "{F4EntityName}"
			// 							}),
			// 							new sap.ui.core.CustomData({
			// 								"key": "FieldLabel",
			// 								"value": "{FieldLabel}"
			// 							})
			// 							]
			// 						}),
			// 						new sap.m.Input({
			// 							value: "{path:'value', type: 'sap.ui.model.type.Decimal'}",
			// 							type: "{TypeKind}",
			// 							enabled: "{= ${Readonly} ? false : true}",
			// 							showValueHelp: "{HasF4}",
			// 							valueHelpRequest: that.onValueHelp.bind(that),
			// 							visible: "{InputDecimalVisible}",
			// 							required: "{path:'Required',formatter:'hcm.fab.mytimeevents.utils.formatter.isRequired'}",
			// 							layoutData: new sap.ui.layout.GridData({
			// 								span: "L5 M5 S12"
			// 							}),
			// 							customData: [new sap.ui.core.CustomData({
			// 								"key": "FieldName",
			// 								"value": "{Name}"
			// 							}), new sap.ui.core.CustomData({
			// 								"key": "ValueHelp",
			// 								"value": "{F4EntityName}"
			// 							}),
			// 							new sap.ui.core.CustomData({
			// 								"key": "FieldLabel",
			// 								"value": "{FieldLabel}"
			// 							})
			// 							]
			// 						}),
			// 						new sap.m.Input({
			// 							value: "{path:'value'}",
			// 							type: "{TypeKind}",
			// 							enabled: "{= ${Readonly} ? false : true}",
			// 							showValueHelp: "{HasF4}",
			// 							valueHelpRequest: that.onValueHelp.bind(that),
			// 							visible: "{InputTextVisible}",
			// 							required: "{path:'Required',formatter:'hcm.fab.mytimeevents.utils.formatter.isRequired'}",
			// 							layoutData: new sap.ui.layout.GridData({
			// 								span: "L5 M5 S12"
			// 							}),
			// 							customData: [new sap.ui.core.CustomData({
			// 								"key": "FieldName",
			// 								"value": "{Name}"
			// 							}), new sap.ui.core.CustomData({
			// 								"key": "ValueHelp",
			// 								"value": "{F4EntityName}"
			// 							}),
			// 							new sap.ui.core.CustomData({
			// 								"key": "FieldLabel",
			// 								"value": "{FieldLabel}"
			// 							})
			// 							]
			// 						}),
			// 						new sap.m.DatePicker({
			// 							value: "{ path: 'datevalue', type: 'sap.ui.model.odata.type.Date'}",
			// 							visible: "{DateVisible}",
			// 							enabled: "{= ${Readonly} ? false : true}",
			// 							layoutData: new sap.ui.layout.GridData({
			// 								span: "L5 M5 S12"
			// 							}),
			// 							customData: new sap.ui.core.CustomData({
			// 								"key": "FieldName",
			// 								"value": "{Name}"
			// 							},
			// 								new sap.ui.core.CustomData({
			// 									"key": "FieldLabel",
			// 									"value": "{FieldLabel}"
			// 								}))
			// 						}),
			// 						new sap.m.TimePicker({
			// 							value: "{ path: 'timevalue', type: 'sap.ui.model.odata.type.Time' }",
			// 							enabled: "{= ${Readonly} ? false : true}",
			// 							visible: "{TimeVisible}",
			// 							layoutData: new sap.ui.layout.GridData({
			// 								span: "L5 M5 S12"
			// 							}),
			// 							customData: new sap.ui.core.CustomData({
			// 								"key": "FieldName",
			// 								"value": "{Name}"
			// 							},
			// 								new sap.ui.core.CustomData({
			// 									"key": "FieldLabel",
			// 									"value": "{FieldLabel}"
			// 								}))
			// 						})
			// 					]
			// 				});
			// 			}
			// 		}
			// 		oFormContainer.setModel(oAddFieldsModel);
			// 		if (oFormElement) {
			// 			oFormContainer.bindAggregation("formElements", "/", oFormElement);
			// 		}
			// 	},
			// 	error: function (oError) {
			// 		that.processError(oError);
			// 	}
			// };
			// this.oDataModel.read("/AdditionalFieldSet", mParameters);
		//}
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

			if (customData.SubtypeText.includes("Telearbeit")) {
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

			if (customData.SubtypeText.includes("Telearbeit")) {
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

