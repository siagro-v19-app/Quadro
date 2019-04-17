sap.ui.define([
	"br/com/idxtecQuadro/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"br/com/idxtecQuadro/services/Session"
], function(BaseController, MessageBox, Filter, FilterOperator, Session) {
	"use strict";

	return BaseController.extend("br.com.idxtecQuadro.controller.QuadroLista", {
		onInit: function() {
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
            
			var oFilter = new Filter("Empresa", FilterOperator.EQ, Session.get("EMPRESA_ID"));
			var oView = this.getView();
			var oTable = oView.byId("tableQuadro");
			
			oTable.bindRows({ 
				path: '/Quadros',
				sorter: {
					path: 'Numero'
				},
				filters: oFilter,
				parameters: {
					expand: 'SafraDetails,ProdutoDetails,UnidadeMedidaDetails'
				}
			});
		},
		
		filtraQuadro: function(oEvent){
			var sQuery = oEvent.getParameter("query");
			var oFilter1 = new Filter("Empresa", FilterOperator.EQ, Session.get("EMPRESA_ID"));
			var oFilter2 = new Filter("Descricao", FilterOperator.Contains, sQuery);
			
			var aFilters = [
				oFilter1,
				oFilter2
			];

			this.getView().byId("tableQuadro").getBinding("rows").filter(aFilters, "Application");
		},
		
		onRefresh: function() {
			this.getModel().refresh(true);
			this.getView().byId("tableQuadro").clearSelection();
		},
		
		onIncluir: function(oEvent) {
			this.getRouter().navTo("quadroAdd");
		},
		
		onEditar: function(oEvent) {
			var oTable = this.getView().byId("tableQuadro");
			var nIndex = oTable.getSelectedIndex();
			
			if (nIndex > -1) {
				var oContext = oTable.getContextByIndex(nIndex);
				this.getRouter().navTo( "quadroEdit" , {
					quadro: oContext.getProperty( "Id" )
				});
				
			} else {
				MessageBox.warning("Selecione um quadro na tabela.");
			}
		},
		
		onRemover: function(e){
			var that = this;
			var oTable = this.byId("tableQuadro");
			var nIndex = oTable.getSelectedIndex();
			
			if (nIndex === -1){
				MessageBox.warning("Selecione um quadro da tabela.");
				return;
			}
			
			MessageBox.confirm("Deseja remover este quadro?", {
				onClose: function(sResposta){
					if(sResposta === "OK"){
						that._remover(oTable, nIndex);
						MessageBox.success("Quadro removido com sucesso!");
					}
				}
			});
		},
		
		_remover: function(oTable, nIndex){
			var oModel = this.getOwnerComponent().getModel();
			var oContext = oTable.getContextByIndex(nIndex);
			
			oModel.remove(oContext.sPath, {
				success: function(){
					oModel.refresh(true);
					oTable.clearSelection();
				}
			});
		},
	});
});