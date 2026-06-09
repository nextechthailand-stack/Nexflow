use strict;
use warnings;
use IO::Socket::INET;

my $port = 3000;
my $root = 'C:/Users/EMC/Desktop/NEXflow';

my $srv = IO::Socket::INET->new(
    LocalPort => $port,
    Listen    => 10,
    ReuseAddr => 1,
) or die "Cannot bind port $port: $!";

print "Serving $root on port $port\n";

while (my $c = $srv->accept) {
    my $req = '';
    while (my $line = <$c>) {
        $req .= $line;
        last if $line eq "\r\n";
    }
    my ($method, $path) = $req =~ /^(\w+) (\S+)/;
    $path //= '/';
    $path =~ s/\?.*//;
    $path =~ s|/\.\./|/|g;

    my $file = $root . $path;
    $file .= 'index.html' if -d $file;

    if (-f $file) {
        open my $fh, '<:raw', $file or do { print $c "HTTP/1.0 500 Error\r\n\r\n"; close $c; next; };
        local $/;
        my $body = <$fh>;
        close $fh;
        my $ct = 'text/html; charset=utf-8';
        $ct = 'text/css; charset=utf-8'       if $file =~ /\.css$/;
        $ct = 'application/javascript'         if $file =~ /\.js$|\.jsx$/;
        $ct = 'image/svg+xml'                  if $file =~ /\.svg$/;
        $ct = 'image/png'                      if $file =~ /\.png$/;
        # No-cache headers — force browser to always fetch fresh files
        my $cache = 'no-cache, no-store, must-revalidate';
        print $c "HTTP/1.0 200 OK\r\nContent-Type: $ct\r\nContent-Length: " . length($body)
                . "\r\nCache-Control: $cache\r\nPragma: no-cache\r\nExpires: 0"
                . "\r\nAccess-Control-Allow-Origin: *\r\n\r\n$body";
    } else {
        print $c "HTTP/1.0 404 Not Found\r\nContent-Type: text/plain\r\n\r\nNot found: $path";
    }
    close $c;
}
