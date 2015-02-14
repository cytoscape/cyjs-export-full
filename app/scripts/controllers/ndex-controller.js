/**
 * Created by kono on 2014/11/08.
 */
angular.module('cyViewerApp')
  .controller('NdexModalCtrl', ['ndexService', '$scope', '$modal', '$log',
    function (ndexService, $scope, $modal, $log) {

      $scope.open = function (size) {

        var modalInstance = $modal.open({
          templateUrl: 'save.html',
          controller: 'NdexModalInstanceCtrl',
          size: size,
          resolve: {
            items: function () {
              return $scope.networkSearchResults;
            }
          }
        });

        modalInstance.result.then(function (network) {

          var networkName = 'NDEx: ' + network.cyjs.data.name;

          console.log('Closing...');
          $log.info(network);
          console.log(network);
          console.log(networkName);

          $scope.ndexNetworks[networkName] = network.original;
          $scope.networks[networkName] = network.cyjs;
          $scope.networkNames.push(networkName);
          $scope.currentNetwork = networkName;
          $scope.$emit('switchNetwork', networkName);

        }, function () {

          $log.info('Modal dismissed at: ' + new Date());
        });
      };
    }
  ]);

angular.module('cyViewerApp')
  .controller('NdexModalInstanceCtrl', ['networkConverterService', 'ndexService', 'ndexHelper', '$rootScope', '$scope', '$modalInstance', '$log',
    function (networkConverterService, ndexService, ndexHelper, $rootScope, $scope, $modalInstance, $log) {

      var MESSAGES = {
        fail: {type: 'danger', msg: 'Login failed: '},
        success: {type: 'success', msg: 'Successfully saved the NDEx network.'}
      };

      $scope.originalNetwork = $rootScope.originalNetwork;
      $scope.currentNetworkData = $rootScope.currentNetworkData;

      $scope.credentials = {
        username: '',
        password: ''
      };

      $scope.alerts = [];


      $scope.closeAlert = function() {
        $scope.alerts = [];
      };

      $scope.save = function () {
        $scope.closeAlert();

        $scope.uuid = false;
        signIn();

        $scope.networkSearchResults = [];

        //$modalInstance.close($scope.selected.item);
      };

      var signIn = function() {
        $scope.alerts.push({type: 'info', msg: 'Logging in.  Please wait...'});

        ndexService.signIn($scope.credentials.username, $scope.credentials.password)
          .success(function (userData) {
            $scope.loggedIn = true;
            $scope.alerts.push({type: 'info', msg: 'Uploading network.'});
            $log.info(userData);
            $scope.credentials.password = null;

            networkConverterService.updateNdexNetwork($scope.originalNetwork, $scope.currentNetworkData);

            ndexService.saveSubnetwork($scope.originalNetwork,
              function(result) {
                $log.info(result);
                $log.info('Done!!!!!!!!!!!!!');
                $scope.alerts.push(MESSAGES.success);
            }, function(err) {
              $log.error(err);
            });
          }).error(function (error) {
            $log.error(error);
            MESSAGES.fail.msg = 'Failed to login: ' + error;
            $scope.alerts.push(MESSAGES.fail);
          });
      };

      $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
      };
    }
  ]);
