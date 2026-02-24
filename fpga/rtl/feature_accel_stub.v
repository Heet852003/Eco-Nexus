module feature_accel_stub (
    input  wire        clk,
    input  wire        rst_n,
    input  wire        in_valid,
    input  wire [31:0] in_data,
    output wire        in_ready,
    output reg         out_valid,
    output reg  [31:0] out_data
);

    // Simple always-ready stub with a 1-cycle "accumulate" behavior.
    // Replace with a real feature extraction/acceleration pipeline.
    assign in_ready = 1'b1;

    reg [31:0] acc;

    always @(posedge clk) begin
        if (!rst_n) begin
            acc <= 32'd0;
            out_valid <= 1'b0;
            out_data <= 32'd0;
        end else begin
            out_valid <= 1'b0;
            if (in_valid && in_ready) begin
                acc <= acc + in_data;
                out_valid <= 1'b1;
                out_data <= acc + in_data;
            end
        end
    end

endmodule

