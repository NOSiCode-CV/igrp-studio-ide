const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

// Load the proto file
const PROTO_PATH = path.join(__dirname, 'protos/logging.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
const logging = protoDescriptor.logging;

// Implement the gRPC service
const errorLoggerService = {
    SendErrorReport: (call, callback) => {
        const request = call.request;

        console.log('Received error report via gRPC:');
        console.log('Error ID:', request.errorId);
        console.log('Message:', request.message);
        console.log('Platform:', request.platform);
        console.log('Session ID:', request.sessionId);
        console.log('Timestamp:', new Date(request.timestamp).toISOString());
        console.log('Additional Attributes:', request.additionalAttributes);

        // Here you can process the error report (save to database, forward to monitoring system, etc.)

        const response = {
            success: true,
            message: 'Error report received successfully',
            reportId: request.errorId,
        };

        callback(null, response);
    },
};

// Create and start the gRPC server
const server = new grpc.Server();
server.addService(logging.ErrorLogger.service, errorLoggerService);

const bindAddress = '0.0.0.0:50051';
server.bindAsync(
    bindAddress,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
        if (err) {
            console.error('Failed to bind server:', err);
            return;
        }

        server.start();
        console.log(`gRPC server running on ${bindAddress}`);
        console.log('Ready to receive error reports from IGRP Studio Horizon');
    }
);

// Handle graceful shutdown
process.on('SIGINT', () => {
    server.tryShutdown(() => {
        console.log('gRPC server shutdown gracefully');
        process.exit(0);
    });
});
