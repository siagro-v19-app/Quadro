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
], function(Controller, MessageBox, JSONModel, ProdutoHelpDialog, SafraHelpDialog,
	UnidadeMedidaHelpDialog, VariedadeHelpDialog, History, Session) {
	"use strict";

	return Controller.extend("br.com.idxtecQuadro.controller.QuadroAdd", {
		onInit: function(){
			var oView = this.getView();
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute( "quadroAdd" ).attachMatched( this._routerMatch , this );
			
			oView.addStyleClass( this.getOwnerComponent().getContentDensityClass() );
				
			this.showFormFragment( "QuadroCampos" );
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
				titulo: "Inserir Quadro"
			});
	
			var oQuadroModel = new JSONModel();
			var oQuadroVariedadeModel = new JSONModel();
			
			var iEmpresaId = Session.get("EMPRESA_ID");
			var iUsuarioId = Session.get("USUARIO_ID");
			
			var sPathEmpresas = "/Empresas(" + iEmpresaId + ")";
			var sPathUsuarios = "/Usuarios(" + iUsuarioId + ")";
			
			var oQuadro = {
				Id: 0,
				Numero: "",
				Descricao: "",
				Produto: 0,
				Safra: 0,
				UnidadeMedida: 0,
				Area: 0.00,
				Encerrado: false,
				Empresa: iEmpresaId,
				Usuario: iUsuarioId,
				EmpresaDetails: { __metadata: { uri: sPathEmpresas } },
				UsuarioDetails: { __metadata: { uri: sPathUsuarios } }
			};
			
			oQuadroModel.setData(oQuadro);
			oQuadroVariedadeModel.setData([]);
			
			this.getView().setModel(oQuadroModel,"quadro");
			this.getView().setModel(oQuadroVariedadeModel,"variedade");
			
			this.getView().byId("produto").setValue(null);
			this.getView().byId("safra").setValue(null);
			this.getView().byId("unidade").setValue(null);
		},
		
		onInserirLinha: function(oEvent) {
			var oQuadroVariedadeModel = this.getView().getModel("variedade");
			
			var oItems = oQuadroVariedadeModel.getProperty("/");
			
			var iEmpresaId = Session.get("EMPRESA_ID");
			var iUsuarioId = Session.get("USUARIO_ID");
			
			var sPathEmpresas = "/Empresas(" + iEmpresaId + ")";
			var sPathUsuarios = "/Usuarios(" + iUsuarioId + ")";
			
			var oNovoVariedade = oItems.concat({
				Id: 0,
	    		Variedade: 0,
				Area: 0.00,
				Quadro: 0,
				Empresa: iEmpresaId,
				Usuario: iUsuarioId,
				EmpresaDetails: { __metadata: { uri: sPathEmpresas } },
				UsuarioDetails: { __metadata: { uri: sPathUsuarios } }
	    });
			
			this.getView().getModel("variedade").setProperty("/", oNovoVariedade);
		},
		
		onRemoverLinha: function(oEvent){
			var oQuadroVariedadeModel = this.getView().getModel("variedade");
			
			var oTable = this.getView().byId("tableQuadroVariedade");
			
			var nIndex = oTable.getSelectedIndex();
			
			if (nIndex > -1) {
				var oItems = oQuadroVariedadeModel.getProperty("/");
				
				oItems.splice(nIndex, 1);
				oQuadroVariedadeModel.setProperty("/", oItems);
				oTable.clearSelection();
			} else {
				sap.m.MessageBox.warning("Selecione um item na tabela!");
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
			
			if(this._verificaCabecalho(this.getView(),oDadosQuadro,oDadosVariedade)){
				return;
			}
			
			for (var i = 0; i < oDadosVariedade.length; i++) {
				soma += oDadosVariedade[i].Area;
			}
			
			if(this._verificaLinhas(oDadosVariedade, soma, oDadosQuadro.Area)){
				return;
			}
			
			var sPathProdutos = "/Produtos(" + oDadosQuadro.Produto + ")";
			var sPathSafras = "/Safras(" + oDadosQuadro.Safra + ")";
			var sPathUnidadeMedidas = "/UnidadeMedidas(" + oDadosQuadro.UnidadeMedida + ")";

			oDadosQuadro.ProdutoDetails = { __metadata: { uri: sPathProdutos } };
			oDadosQuadro.SafraDetails = { __metadata: { uri: sPathSafras } };
			oDadosQuadro.UnidadeMedidaDetails = { __metadata: { uri: sPathUnidadeMedidas } };
			oDadosQuadro.QuadroVariedadeDetails = [];
		
			for ( var i = 0; i < oDadosVariedade.length; i++) {
				
				var iVariedadeId = oDadosVariedade[i].Variedade;
				
				var sPathVariedade = "/Variedades(" + iVariedadeId + ")";
				
				oDadosVariedade[i].VariedadeDetails = { __metadata: { uri: sPathVariedade } };

				oDadosQuadro.QuadroVariedadeDetails.push(oDadosVariedade[i]);
			}

			oModel.create("/Quadros", oDadosQuadro, {
				success: function(){
					sap.m.MessageBox.success("Quadro inserido com sucesso!",{
						onClose: function() {
							that.navBack();
						}
					});
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
			var oPage = this.getView().byId("pageQuadroAdd");
			oPage.removeAllContent();
			oPage.insertContent(this._getFormFragment(sFragmentName));
		},
		
		fechar: function(oEvent) {
			var oTable = this.getView().byId("tableQuadroVariedade");
			var that = this;
			console.log(oTable.getBinding().getLength());
			if(oTable.getBinding().getLength() >= 1){
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
		
		_verificaCabecalho: function(oView, oDadosQuadro, oDadosVariedade){
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
		
		_verificaLinhas: function(oDadosVariedade, soma, nArea){
			for(var i=0; i<oDadosVariedade.length; i++){
				if(oDadosVariedade[i].Variedade === 0){
					MessageBox.warning("Preencha uma variedade!");
					return true;
				} else if(oDadosVariedade[i].Area === 0){
					MessageBox.warning("As áreas não podem ser iguais a 0 (zero).");
					return true;
				}
			}
			
			if(soma !== nArea){
				MessageBox.warning("Soma das áreas não corresponde a área total!");
				return true;
			}
		}
	});
});