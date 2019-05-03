sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	"br/com/idxtecQuadro/helpers/ProdutoHelpDialog",
	"br/com/idxtecQuadro/helpers/SafraHelpDialog",
	"br/com/idxtecQuadro/helpers/UnidadeMedidaHelpDialog",
	"br/com/idxtecQuadro/helpers/VariedadeHelpDialog",
	"sap/ui/core/routing/History",
	"br/com/idxtecQuadro/services/Session"
], function( Controller , MessageBox , JSONModel , ProdutoHelpDialog , SafraHelpDialog ,
	UnidadeMedidaHelpDialog , VariedadeHelpDialog , History , Session) {
	"use strict";

	return Controller.extend( "br.com.idxtecQuadro.controller.QuadroEdit" , {
		onInit: function(){
			var that = this;
			var oView = this.getView();
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute( "quadroEdit" ).attachMatched( this._routerMatch , this );
			
			oView.addStyleClass( this.getOwnerComponent().getContentDensityClass() );
			
			var oModel = this.getModel();
			oModel.attachBatchRequestCompleted(function (){
				
				that.showFormFragment( "QuadroCampos" ).then(function (){
					oView.setBusy( false ); 
				}); 
			});
		},
		
		onBeforeRendering: function(){
			var oModel = this.getModel();
			var oView = this.getView();
			
			oView.setBusyIndicatorDelay(0);
			oModel.attachBatchRequestSent( function(){
				oView.setBusy( true ); 
			} );
		},
		
		getModel : function( sModel ) {
			return this.getOwnerComponent().getModel( sModel );	
		},
		
		handleSearchProduto: function(oEvent){
			var sInputId = oEvent.getParameter("id");
			ProdutoHelpDialog.handleValueHelp(this.getView(), sInputId, this);
		},
		
		handleSearchSafra: function(oEvent){
			var sInputId = oEvent.getParameter("id");
			SafraHelpDialog.handleValueHelp(this.getView(), sInputId, this);
		},
		
		handleSearchUnidade: function(oEvent){
			var sInputId = oEvent.getParameter("id");
			UnidadeMedidaHelpDialog.handleValueHelp(this.getView(), sInputId, this);
		},
		
		handleSearchVariedade: function(oEvent){
			var sInputId = oEvent.getParameter("id");
			VariedadeHelpDialog.handleValueHelp(this.getView(), sInputId, this);
		},
		
		_routerMatch: function(oEvent) {
			var oViewModel = this.getModel("view");
			
			oViewModel.setData({
				titulo: "Editar Quadro"
			});
			
			var sQuadro = oEvent.getParameter("arguments").quadro;
			var iQuadroId = parseInt(sQuadro, 0);
			
			var oCompareModel = new JSONModel();
			var oQuadroModel = new JSONModel();
			var oQuadroVariedadeModel = new JSONModel();
			var oModel = this.getModel();
			
			var sPathQuadros = "/Quadros(" + iQuadroId + ")";
			var sPathQuadroVariedades = "/QuadroVariedades";
			
			oModel.read(sPathQuadros, {
				success: function(oQuadro){
					oQuadroModel.setData(oQuadro);
				}
			});
			
			oModel.read(sPathQuadroVariedades,{
				filters: [
					new sap.ui.model.Filter({
						path: 'Quadro',
						operator: sap.ui.model.FilterOperator.EQ,
						value1: sQuadro
					})
				],
			
				success: function(oData) {
					oCompareModel.setData(oData.results);
					oQuadroVariedadeModel.setData(oData.results);
				}
				
			});
			
			this.getView().setModel(oCompareModel, "compare"); 
			this.getView().setModel(oQuadroModel, "quadro");
			this.getView().setModel(oQuadroVariedadeModel, "variedade");
		},
		
		onInserirLinha: function(oEvent) {
			var oQuadroModel = this.getView().getModel("quadro");
			var oQuadroVariedadeModel = this.getView().getModel("variedade");
			var oItems = oQuadroVariedadeModel.getProperty("/");

			var iQuadroId = oQuadroModel.getProperty("/Id")
			var iEmpresaId = Session.get("EMPRESA_ID");
			var iUsuarioId = Session.get("USUARIO_ID");

			var sPathQuadros = "/Quadros(" + iQuadroId + ")";
			var sPathEmpresas = "/Empresas(" + iEmpresaId + ")";
			var sPathUsuarios = "/Usuarios(" + iUsuarioId + ")";

			var oNovoVariedade = oItems.concat({
				Id: 0,
	    		Variedade: 0,
				Area: 0.00,
				Quadro: iQuadroId,
				QuadroDetails: { __metadata: { uri: sPathQuadros } },
				Empresa: iEmpresaId,
				EmpresaDetails: { __metadata: { uri: sPathEmpresas } },
				Usuario: iUsuarioId,
				UsuarioDetails: { __metadata: { uri: sPathUsuarios } }
	    	});
			
			this.getView().getModel("variedade").setProperty("/", oNovoVariedade);
		},
		
		onRemoverLinha: function(oEvent){
			var oQuadroVariedadeModel = this.getView().getModel("variedade");
			
			var oTable = this.getView().byId("tableQuadroVariedade");

			var nIndex = oTable.getSelectedIndex();
			var oModel = this.getModel();
			
			if (nIndex > -1) {
				var oContext = oTable.getContextByIndex(nIndex);
				var oDados = oContext.getObject();
				var oItems = oQuadroVariedadeModel.getProperty("/");
				
				if (oDados.Id !== 0) {
					oModel.remove(`/QuadroVariedades(${oDados.Id})`, {
						groupId: "upd"
					});
				}
				
				oItems.splice(nIndex,1);
				oQuadroVariedadeModel.setProperty("/", oItems);
				oTable.clearSelection();
			} else {
				sap.m.MessageBox.warning("Selecione uma variedade na tabela!");
			}
		},
		
		salvar: function() {
			var that = this;
			var soma = 0;
			var oQuadroModel = this.getView().getModel("quadro");
			var oQuadroVariedadeModel = this.getView().getModel("variedade");
			var oModel = this.getModel();
			
			var oDadosQuadro = oQuadroModel.getData();
			var oDadosVariedade = oQuadroVariedadeModel.getData();
			
			if (oDadosVariedade.length === 0) {
				sap.m.MessageBox.warning("Quadro não possui variedades.");
				return;
			}

			for (var i = 0; i < oDadosVariedade.length; i++) {
				soma += parseFloat(oDadosVariedade[i].Area, 0);
			}
			
			if(this._verificaCabecalho(this.getView(),oDadosQuadro,oDadosVariedade)){
				return;
			}
			
			if(this._verificaLinhas(oDadosVariedade, soma, parseFloat(oDadosQuadro.Area))){
				return;
			}
			
			var iQuadroId = oDadosQuadro.Id;

			var sPathProdutos = "/Produtos(" + oDadosQuadro.Produto + ")";
			var sPathSafras = "/Safras(" + oDadosQuadro.Safra + ")";
			var sPathUnidadeMedidas = "/UnidadeMedidas(" + oDadosQuadro.UnidadeMedida + ")";
			var sPathQuadros = "/Quadros(" + iQuadroId + ")";

			oDadosQuadro.ProdutoDetails = { __metadata: { uri: sPathProdutos } };
			oDadosQuadro.SafraDetails = { __metadata: { uri: sPathSafras } };
			oDadosQuadro.UnidadeMedidaDetails = { __metadata: { uri: sPathUnidadeMedidas } };
			
			oModel.setDeferredGroups(["upd"]);
			
			var mParameters = { groupId: "upd" };
			oModel.update(sPathQuadros, oDadosQuadro, mParameters);
			
			for (var i = 0; i < oDadosVariedade.length; i++) {
				
				var iItemId = oDadosVariedade[i].Id;
				var iQuadroId = oDadosVariedade[i].Quadro;
				var iVariedadeId = oDadosVariedade[i].Variedade;

				var sQuadroPath = "/Quadros(" + iQuadroId + ")";
				var sVariedadesPath = "/Variedades(" + iVariedadeId + ")";
				var sPathQuadroVariedades = "/QuadroVariedades";

				var sArea = oDadosVariedade[i].Area;
				var fArea = parseFloat( sArea );
				
				oDadosVariedade[i].VariedadeDetails = { __metadata: { uri: sVariedadesPath} };
				oDadosVariedade[i].Area = fArea;

				if (iItemId === 0){
					oModel.create(sPathQuadroVariedades, oDadosVariedade[i], mParameters);
				} else {
					sPathQuadroVariedades = "/QuadroVariedades(" + iItemId + ")";
					oModel.update(sPathQuadroVariedades, oDadosVariedade[i], mParameters);
				}
			}
			
			oModel.submitChanges({
				groupId: "upd",
				success: function(oResponse) {
					//se a propriedade response não for undefined, temos erro de gravação
					var erro = oResponse.__batchResponses[0].response;
					if (!erro) {
						sap.m.MessageBox.success("Quadro alterado com sucesso!",{
							onClose: function() {
								that.navBack();
							}
						});
					}
				}
			});
		},
		
		navBack: function(){
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();
			
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				oRouter.navTo("quadroLista", {}, true);
			}
		},
		
		_getFormFragment: function (sFragmentName) {
			if (this._formFragment) {
				return this._formFragment;
			}
		
			this._formFragment = sap.ui.xmlfragment(this.getView().getId(),`br.com.idxtecQuadro.view.${sFragmentName}`, this);

			return this._formFragment;
		},

		showFormFragment : function (sFragmentName) {
			var that = this;
			return new Promise(function (resolve){
				var oPage = that.getView().byId("pageQuadroEdit");
				oPage.removeAllContent();
				oPage.insertContent(that._getFormFragment(sFragmentName), 0);
				resolve();
			});
		},
		
		fechar: function (oEvent) {
			var that = this;
			var oCompareModel = this.getView().getModel("compare");
			var oQuadroVariedadeModel = this.getView().getModel("variedade");
			
			var oDadosCompare = oCompareModel.getData();
			var oDadosVariedade = oQuadroVariedadeModel.getData();
			
			if(oDadosCompare.length !== oDadosVariedade.length){
				sap.m.MessageBox.confirm("Todas as informações serão descartadas, deseja continuar?", {
					onClose: function(sResposta){
						if(sResposta === "OK"){
							that.navBack();
						}
					}
				});
			} else{
				this.navBack();
			}
		},
		
		_verificaCabecalho: function (oView, oDadosQuadro, oDadosVariedade){
			if(oView.byId("numero").getValue() === "" || oView.byId("descricao").getValue() === ""
			|| oView.byId("produto").getValue() === "" || oView.byId("safra").getValue() === ""
			|| oView.byId("unidade").getValue() === "" || oView.byId("area").getValue() === ""){
				MessageBox.warning("Preencha todos os campos!");
				return true;
			} else if(oDadosQuadro.Area === 0){
				MessageBox.warning("A área total não pode ser igual a 0 (zero).");
				return true;
			} else if(oDadosVariedade.length === 0) {
				MessageBox.warning("Quadro não possui variedades.");
				return true; 
			} 
		},
		
		_verificaLinhas: function (oDadosVariedade, nSoma, nArea){
			for(var i = 0; i < oDadosVariedade.length; i++ ){
				if(oDadosVariedade[i].Variedade === 0){
					MessageBox.warning("Preencha uma variedade!");
					return true;
				} else if(oDadosVariedade[i].Area === 0){
					MessageBox.warning("As áreas não podem ser iguais a 0 (zero).");
					return true;
				}
			}
			
			if ( nSoma !== nArea ){
				MessageBox.warning("Soma das áreas não corresponde a área total!");
				return true;
			}
		}
	});
});