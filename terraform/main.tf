terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }
  required_version = ">= 1.2.0"
}

provider "aws" {
  region = "us-east-1"
}

# security group & port definitions
resource "aws_security_group" "instance_sg" {
  name        = "instance_security_group"
  description = "Allow inbound access on port 3000"

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Allowing all IPs; restrict as needed
  }
  ingress {
    from_port   = 0
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Allowing all IPs; restrict as needed
  }
  ingress {
    from_port   = 0
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # allowing all IPs
  }

  ingress {
    from_port   = 0
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # allowing all IPs
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# key pair 
resource "aws_key_pair" "new-key" {
  key_name   = "new-key"
  public_key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH0EhxITzFvkBex+ZPjdGkSeDqXiHyZ6BgL4tFOOztfZ junyanglu@vl965-172-31-101-75.wireless.umass.edu"
}

# 4 cores + 16GB RAM + 32GB SSD
resource "aws_instance" "instance" {
  ami             = "ami-0cad6ee50670e3d0e" # Ubuntu image
  instance_type   = "t3.xlarge"
  key_name        = aws_key_pair.new-key.key_name
  security_groups = [aws_security_group.instance_sg.name]

  # request for 32GB SSD
  root_block_device {
    volume_size = 32    
    volume_type = "gp3" # general-purpose storage
  }

  tags = {
    Name = "OneDef_Ubuntu_Hosting"
  }
}
